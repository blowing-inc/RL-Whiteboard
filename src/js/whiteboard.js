import { Draggable } from "./utils";
import paper from 'paper';

class RLWhiteboard {
	constructor() {
		this._RL_OPTIONS = {						
			balls: {
				amount: 1,
				scale: 0.03,
				model: 'ball'
			},			  
			cars: {
				amount: 2,
				scaleX: 0.06,
				scaleY: 0.05,
				model: 'default',
				teams: ['orange', 'blue']
			},
			map: {
				model: 'dfh-stadium.png'
			},
			arrows: {
				color: 'white',
				width: 4
			},
			boostpads: {
				show: true,
				color: 'rgba(255,255,0,0.7)',
			},
			grid: {
				show: true,
				color: 'rgba(0,0,0,0.5)',
				width: 4,
			},
			path: {
				image: './img/',
				cars: './img/cars/'
			},
			debug: false
		};
		this._RL_DATA = {
			arrows: [],
			balls: [],
			boostpads: [],
			cars: [],
			grid: [],
			map: null
		}
		this._RL_PRESETS = {
			balls: require('../presets/balls.json'),
			boostpads: require('../presets/boostpads.json'),
			kickoffs: require('../presets/kickoffs.json'),
			grid: require('../presets/grid.json'),
		}
	}
	start() {
		paper.install(window);
		this.setupCanvas();
		this.render();
	}
	setupCanvas() {
		var _this = this;
		var isDrawing = false;
		var draggingIndex = -1;
		var ctrlPressed = false;		
		paper.setup('mapCanvas');		
		var tool = new Tool();
		var path;
		tool.onMouseDown = function (event) {			
			var draggables = _this._RL_DATA.cars.concat(_this._RL_DATA.balls);
			if (!isDrawing && draggables.length > 0) {
				for (var ix = 0; ix < draggables.length; ix++) {					
					if (draggables[ix].contains(event.point)) {						
						draggingIndex = ix;
						break;
					}
				}
			}
			if (draggingIndex == -1) {
				path = new Path({
					segments: [event.point],
					strokeColor: _this._RL_OPTIONS.arrows.color,
					strokeWidth: _this._RL_OPTIONS.arrows.width,
				});				
				isDrawing = true;
			}
			if(_this._RL_OPTIONS.debug)
				console.log({x: event.point.x / paper.view.viewSize.width, y: event.point.y / paper.view.viewSize.height});
		}
		tool.onMouseDrag = function (event) {
			var draggables = _this._RL_DATA.cars.concat(_this._RL_DATA.balls);
			if (draggingIndex > -1) {
				let delta = (event.point.subtract(draggables[draggingIndex].position));
				draggables[draggingIndex].rotation = delta.angle;
				draggables[draggingIndex].position = event.point;
			} else{
				path.add(event.point);
			}
		}
		tool.onMouseUp = function (event) {
			if (isDrawing) {
				path.simplify(300);
				var vector = path.getPointAt(path.length).subtract(path.getPointAt(path.length - 25));
				var arrowVector = vector.normalize(18);
				var path2 = new Path({
					segments: [path.getPointAt(path.length).add(arrowVector.rotate(145)), path.getPointAt(path.length), path.getPointAt(path.length).add(arrowVector.rotate(-145))],
					fillColor: _this._RL_OPTIONS.arrows.color,
					strokeWidth: _this._RL_OPTIONS.arrows.width * 1.5,
				});
				path2.scale(1.3);
				_this._RL_DATA.arrows.push(path);
				_this._RL_DATA.arrows.push(path2);
			}
			isDrawing = false;
			draggingIndex = -1;
		}
		tool.onKeyDown = function (event) {
			if (event.key === 'escape'){
				event.preventDefault();
				_this.clearArrows();
			}
			if (event.key === 'control')
				ctrlPressed = true;
			if (ctrlPressed && event.key === 'z') {
				event.preventDefault();
				_this.undoArrow();
			}
			if (ctrlPressed && event.key === 'b') {
				event.preventDefault();
				_this.toggleBoostPads();
			}
			if (ctrlPressed && event.key === 'g') {			
				event.preventDefault();
				_this.toggleGrid();
			}
			if (ctrlPressed && event.key === 'r') {			
				event.preventDefault();
				_this.resetKickoff();
			}
		}   
		tool.onKeyUp = function (event) {
			if(event.key === 'control')
				ctrlPressed = false;
		}
	}
	render() {		
		var raster = new Raster(`${this._RL_OPTIONS.path.image}${this._RL_OPTIONS.map.model}`);
		raster.size = paper.view.viewSize;
		raster.position = view.center;
		this._RL_DATA.map = raster;
		setTimeout(() => {
			this.renderGrid();
			this.renderBoostPads();
			this.renderBalls();
			this.renderCars();
		}, 500);
	}
	renderBalls() {
		this._RL_DATA.balls.forEach((ball) => ball.remove());
		var balls = this._RL_OPTIONS.balls;		
		for(let x = 1; x <= balls.amount; x++){					  
			var ball = new Raster({
				source: `${this._RL_OPTIONS.path.image}${balls.model}.png`,
				position: this._percentToSize(this._RL_PRESETS.balls[x === 1 ? 0 : 1]),
				size: new Size(paper.view.viewSize.width * balls.scale, paper.view.viewSize.width * balls.scale),
			});	
			this._RL_DATA.balls.push(ball);
		}  
		this._renderOrder();
	}
	renderCars() {		
		this._RL_DATA.cars.forEach((car) => car.remove());		
		this._RL_DATA.cars = [];
		const kickoffs = this._shuffleArray([...this._RL_PRESETS.kickoffs]);			
		for(let x = 1; x <= this._RL_OPTIONS.cars.amount; x++){				  
			const kickoff = kickoffs.pop();
			this._RL_OPTIONS.cars.teams.forEach((team) => {
				var car = new Raster({
					source: `${this._RL_OPTIONS.path.cars}${this._RL_OPTIONS.cars.model}-${team}.png`,
					size: new Size(paper.view.viewSize.width * this._RL_OPTIONS.cars.scaleX, paper.view.viewSize.height * this._RL_OPTIONS.cars.scaleY),
					position: this._percentToSize(kickoff[team]),
					rotation: kickoff[team].rotation
				});
				this._RL_DATA.cars.push(car);
			});
		}  
		this._renderOrder();
	}
	renderGrid() {
		document.getElementById("btnGrid").classList.toggle("bg-blue-900", this._RL_OPTIONS.grid.show);
		this._RL_DATA.grid.forEach((grid) => grid.remove());
		this._RL_DATA.grid = [];
		if(this._RL_OPTIONS.grid.show) {
			this._RL_PRESETS.grid.forEach((grid) => {
				var line = new Path();				
				line.strokeColor = this._RL_OPTIONS.grid.color;
				line.strokeWidth = this._RL_OPTIONS.grid.width;
				let relative = {start: this._percentToSize(grid.start), end: this._percentToSize(grid.end)};				
				line.add(new Point(relative.start.x, relative.start.y));
				line.add(new Point(relative.end.x, relative.end.y));
				this._RL_DATA.grid.push(line);444
			});
		}
		this._renderOrder();
	}
	renderBoostPads() {
		document.getElementById("btnBoostPad").classList.toggle("bg-blue-900", this._RL_OPTIONS.boostpads.show);
		this._RL_DATA.boostpads.forEach((boostPad) => boostPad.remove());
		this._RL_DATA.boostpads = [];
		if(this._RL_OPTIONS.boostpads.show) {
			this._RL_PRESETS.boostpads.forEach((pad) => {
				const viewSize = paper.view.viewSize;
				let relative = this._percentToSize(pad);
				var boostPad = new Path.Circle(new Point(relative.x, relative.y), viewSize.width * (pad.full ?  0.01 : 0.005));
				boostPad.fillColor = this._RL_OPTIONS.boostpads.color;
				this._RL_DATA.boostpads.push(boostPad);
			});
		}   
		this._renderOrder();
	}
	toggleBoostPads() {		
		this._RL_OPTIONS.boostpads.show = !this._RL_OPTIONS.boostpads.show;
		this.renderBoostPads();
	}
	toggleGrid() {
		this._RL_OPTIONS.grid.show = !this._RL_OPTIONS.grid.show;
		this.renderGrid();
	}
	clearArrows() {
		this._RL_DATA.arrows.forEach((arrow) => arrow.remove());
		this._RL_DATA.arrows = [];
	}
	undoArrow() {
		if(this._RL_DATA.arrows.length > 0){
			this._RL_DATA.arrows.pop().remove();
			this._RL_DATA.arrows.pop().remove();
		}
	}
	resetKickoff() {
		this.renderCars();
		this.renderBalls();
	}
	setArrowColor(button, color) {
		document.querySelectorAll(".btn-color").forEach((element) => { element.innerText = '' });
		button.innerText = 'x';
		_rlwb._RL_OPTIONS.arrows.color = color;
	}
	setCarAmount(button, amount) {
		document.querySelector(".btn-player.bg-blue-900").classList.remove("bg-blue-900");
		button.classList.add("bg-blue-900");
		this._RL_OPTIONS.cars.amount = amount;		
		this.renderCars();
	}
	setBallAmount(button, amount) {
		document.querySelector(".btn-ball.bg-blue-900").classList.remove("bg-blue-900");
		button.classList.add("bg-blue-900");
		this._RL_OPTIONS.balls.amount = amount;
		this.renderBalls();
	}
	_renderOrder() {
		this._RL_DATA.arrows.forEach((elem) => elem.sendToBack());
		this._RL_DATA.balls.forEach((elem) => elem.sendToBack());
		this._RL_DATA.cars.forEach((elem) => elem.sendToBack());
		this._RL_DATA.boostpads.forEach((elem) => elem.sendToBack());
		this._RL_DATA.grid.forEach((elem) => elem.sendToBack());
		this._RL_DATA.map.sendToBack();
	}
	_percentToSize(value) {
		if(typeof value === 'object')
			return {x: paper.view.viewSize.width * value.x, y: paper.view.viewSize.height * value.y};
		return paper.view.viewSize.width * value;
	}
	_shuffleArray(array) {
		let currentIndex = array.length,  randomIndex; 
		while (currentIndex != 0) {
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;
			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}		
		return array;
	}
  /*
  setDraggables() {  
	var draggable = new Draggable();  
	interact(".draggable").draggable({		
		modifiers: [
			interact.modifiers.snap({
			  targets: [
				interact.snappers.grid({ x: 1, y: 1 })
			  ],
			}),
			interact.modifiers.restrictRect({
				restriction: document.getElementById('mapCanvas')
			}),
		],	   
		listeners: {
			start(event) {
				draggable = new Draggable();
			},
			move (event) {							 
				event.target.classList.add("active");
				event.target.style.top = `${event.target.offsetTop + event.dy}px`,
				event.target.style.left = `${event.target.offsetLeft + event.dx}px`	   
				document.getElementById("workArea").addEventListener("mousemove", draggable.detectMovment);				
			},
			end (event) {				 
				event.target.classList.remove("active");
				document.getElementById("workArea").removeEventListener("mousemove", draggable.detectMovment);
			}

		},
	});	
  }*/
  setPlayers(players = this._RL_OPTIONS.players) {
	this._RL_OPTIONS.players = players;
  }
  setBalls(balls = this._RL_OPTIONS.balls) {
	this._RL_OPTIONS.balls = balls;
  }
  getOptions() {
	return this._RL_OPTIONS;
  }
  setOptions(options = this._RL_OPTIONS) {
	this._RL_OPTIONS = options;
	return options;
  }
}

export default RLWhiteboard;
