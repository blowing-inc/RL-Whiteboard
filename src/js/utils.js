export class Draggable{

	constructor() {		 
		this.stop = false;	 
		this.ticker = new Ticker();
		this.ticker.add(this.update);
	}

	update(delta) {			
			//console.log(delta);
	}

	destroy() {
		this.stop = false;
		console.log("destroying", this.ticker, this.ticker.stop);
		this.ticker.stop;
		console.log(this.ticker.listeners);
		ticker.listeners = [];
		ticker = null;
	}
}

class Ticker {

	maxElapsedMS = 100;
	lastTime = -1;
	elapsedMS = -1;
	deltaTime = 1;
	speed = 1;
	listeners = [];
	started = false;		
	
	constructor(fps = 60) {
		this.stop = false;
		this.targetFPMS = fps / 1000;
	}

	stop() {
		this.stop = true;
	}
	
	add(listener) {		 
		this.listeners.push(listener);			
		if (this.listeners.length && !this.started) {
			this.started = true;
			if(!this.stop)
				requestAnimationFrame(this.update);
		}
	}
	
	update = (currentTime = performance.now()) => {						
		this.elapsedMS = currentTime - this.lastTime;		
		this.deltaTime = this.elapsedMS * this.targetFPMS * this.speed;	
		if (this.elapsedMS > this.maxElapsedMS) {
			this.elapsedMS = this.maxElapsedMS;
		}		
		for (let listener of this.listeners) {
			listener(this.deltaTime);
		}				 
		this.lastTime = currentTime;		
		if(!this.stop)
			requestAnimationFrame(this.update);
	}
}