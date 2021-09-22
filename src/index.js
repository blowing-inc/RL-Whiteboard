import "./css/styles.css"
import '@fortawesome/fontawesome-free/js/fontawesome'
import '@fortawesome/fontawesome-free/js/solid'
import '@fortawesome/fontawesome-free/js/regular'
import '@fortawesome/fontawesome-free/js/brands'
import RLWhiteboard from "./js/whiteboard"

if (window._rlwb) 
	console.error("A variable _rlwb has already been declared");
else {
	window._rlwb = new RLWhiteboard();
	window._rlwb.start();
}