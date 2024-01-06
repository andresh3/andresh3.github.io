/***** DOC *****
 * FUNCTIONS *
 * DispatchScoreboardEvent(event_type, value, asset_id) - Dispatches a ScoreboardEvent with event_type, and value and asset_id in the detail object.
 * 		Params: event_type - Type: event string: "scoreboard_update" - represents an update to the HTML scoreboard
 * 												"increment" - represents an increment/decrement operation preformed by an Incrementor button
 * 			value - the specified value for the event operation Type: integer (number)
 * 			asset_id - the asset which is being updated Type: string (resolveable asset id)
 * 
 * 
 * CLASSES *
 * 
 * ScoreboardUpdate() - Extends CustomEvent, allows modification to our event class if needed.
 * 
 * Assets(obj) - Purpose: Initial values to store.	
 * 		Params: 	obj - Type: Object, JSON string, undefiend or null. Object keys: charm, herb, blood, potion, gold, gameplay_vp	
 * 		Methods:
 * 			GetJson() - Return Value: JSON formatted string containing the internally stored asset values.
 * 			
 * 			GetKeys() - Returns a list of asset types
 * 
 * 			GetAsset(id) - Return Value: Specific value of asset specified with id
 * 				Params: id - Type: string Purpose: Specifies the specific game asset value to fetch
 * 		
 * 			SetAsset(id,value) - Purpose: Sets a specific game asset to specified value.
 * 				Params: id - Type: string Purpose: Specifies the specific game asset value to modify
 * 					value - Type: number (integer) Purpose: Specifies the new value for it.
 * 			
 * 			IncrAsset(id, amount) - Purpose: Increments specified asset by specific amount. Amount can be negative for decrement.
 * 				Params: id - Type: string Purpose: Specifies the specific game asset value to modify
 * 					amount - Type: number (integer) Purpose: Specifies amount to add to specified asset.
 * 
 * Incrementor() - Purpose: Extends HTMLButtonElement to create a custom button element that sends ScoreboardEvents to body when pressed.
 * 		Events: Dispatches a "increment" ScoreboardEvent with the assigned asset_id and increment value.
 * 		Note: Not used directly, used for custom HTML element "increment-button"
 * 		Variables: asset_id - assigned after initializing the HTML object. String that specifies which asset to modify
 * 			amount - how much to add/subtract from said element
 * 
 * DynamicValue() - Purpose: Extends HTMLSpanElement to create a custom element that automatically updates when receiving a "scoreboard_update" event
 * 		Events: Listens for "scoreboard_update" event. Takes "value" as the new value to reflect
 * 		Note: Not used directly, used for custom HTML element "dynamic-value"
 * 		Variables: asset_id - the name/id/key of the asset value to listen for.
 * Scoreboard(board) - Purpose: creates and integrates the assets to a HTML facing scoreboard app
 * 		No public methods.
 * 		Params: board - DOMElement that will contain the scoreboard.
*/

/* Consts */
const DISPLAY_NAME = {
	charm: "Charm",
	herb: "Herb",
	blood: "Blood",
	potion: "Potion",
	gold: "Gold",
	gameplay_vp: "VP"
}
const ASSET_TO_VP_CONVERSION = {
	charm: 1/3,
	herb: 1/3,
	blood: -1,
	potion: 1/3,
	gold: 1,
	gameplay_vp: 1
}

const DEFAULT_SCOREBOARD = {
	charm: 1,
	herb: 1,
	blood: 1,
	potion: 1,
	gold: 1,
	gameplay_vp: 0
}

class ScoreboardUpdate extends CustomEvent
{} // We could use CustomEvent too

// Dispatch new values to the scoreboard for display:
function DispatchScoreboardEvent(event_type, value, asset_id)
{
	if (typeof(asset_id)!="string") 
		throw new TypeError("Parameter element_id must be a string.")
	if (typeof(value)!="number") 
		throw new TypeError("Parameter amount must be a number.")
	if (typeof(event_type)!="string") 
		throw new TypeError("Parameter event_type must be a string.")

	const event = new ScoreboardUpdate(event_type, {detail: {
		"id": asset_id,
		"value": value
	}});
	document.body.dispatchEvent(event)
}


class Assets
{
//Private
	#obj = {};
// Public
	constructor(obj)
	{
		// Initialize defaults
		Object.assign(this.#obj,DEFAULT_SCOREBOARD); // Create copy

		// set values from JSON object + TypeError handling
		if(typeof(obj) == "string")
			try {
				obj = JSON.parse(obj)
			} catch(e) {
				throw new TypeError(`Paramter "obj" is not a valid object, JSON string or undefined.`)
			}
		if(obj == undefined || obj == null)
			return;
		if(typeof(obj) != 'object')
			throw new TypeError(`Parameter "obj" is not a valid object, JSON string or undefined`)

		// Assign all provided values
		let asset,value;
		// Trusting user implementation here.
		Object.assign(this.#obj,obj);

	}
	GetJSON()
	{
		return JSON.stringify(this.#obj);
	}
	GetKeys()
	{
		return Object.keys(this.#obj);
	}
	GetAsset(id)
	{
		if(typeof(id) != "string")
			throw new TypeError("Parameter ID is not a valid string.")
		return this.#obj[id]
	}
	SetAsset(id,value)
	{
		if(typeof(id) != "string")
			throw new TypeError("Parameter id is not a valid string.")
		if(typeof(value) != "number")
			throw new TypeError("Parameter value is not a valid string.")
		if(this.#obj[id])
			this.#obj[id] = value;
	}
	// Increments the score by amount
	// Or decrements of amount is negative
	IncrAsset(id,amount)
	{
		if(typeof(id) != "string")
			throw new TypeError("Parameter id is not a valid string.")
		if(typeof(amount) != "number")
			throw new TypeError("Parameter amount is not a valid string.")
		if(this.#obj[id]!=undefined && this.#obj[id]!=null)
		{
			if( this.#obj[id] + amount >= 0 || this.#obj[id] + amount > this.#obj[id])
				this.#obj[id] += amount;
		}
	}
}

// Define some custom HTML elements that will
// have specific behaviors that we like.
class Incrementor extends HTMLButtonElement {
	constructor()
	{
		super();
		this.onclick = ((e)=>{
			if(this.asset_id == undefined || this.asset_id == null)
				return;
			DispatchScoreboardEvent("increment",this.amount,this.asset_id);
		});
	}
	// Defines which asset we will modify.
	asset_id;
	amount = 0;
}
class DynamicValue extends HTMLSpanElement {
	constructor()
	{
		super();
		document.body.addEventListener("scoreboard_update", (e)=>{
			if(this.asset_id == e.detail.id)
				this.innerText = e.detail.value;
		});
	}
	asset_id;
}
customElements.define("increment-button", Incrementor, {extends: "button"});
customElements.define("dynamic-value", DynamicValue, {extends: "span"});

// Keep track of the values
class Scoreboard
{
	constructor(board)
	{
		// Verify form is a DOMElement (resolveable)
		if(board == undefined)
			throw new TypeError(`Parameter "board" must be provided.`)
		if(typeof(board) == "string")
		{
			board = document.getElementById(board);
			console.log(board instanceof Element)
		}
		if (!(board instanceof Element))
		{
			throw new TypeError(`Parameter "board" is not a valid element or element ID string.`)
		}
		// set out private variables
		this.#board = board;
		this.#assets = new Assets( this.#GetLocalStorage() );		// Load assets from local storage (if available)
		// Listen for any modifications to scoreboard
		document.body.addEventListener("increment", (e)=>{
			// Modify our asset
			this.#assets.IncrAsset(e.detail.id, e.detail.value);
			this.#SetLocalStorage(); // Update localStorage
			DispatchScoreboardEvent("scoreboard_update",this.#assets.GetAsset(e.detail.id), e.detail.id);
			this.#UpdateVP();
		})

		this.#MakeForm();
		this.#UpdateVP();
	}

// Private
	#assets; 	// represents an Assets() object
	#board;		// Represents a DOMElement
	#vp;
	#GetLocalStorage()
	{
		return localStorage.getItem("assets");
	}
	#SetLocalStorage()
	{
		localStorage.setItem("assets", this.#assets.GetJSON())
	}
	#ClearLocalStorage()
	{
		localStorage.removeItem("assets");
	}
	#UpdateVP()
	{
		let vp = 0;
		for(let asset of this.#assets.GetKeys())
		{
			vp += Math.floor( ASSET_TO_VP_CONVERSION[asset]*this.#assets.GetAsset(asset) );
		}
		this.#vp = vp;
		DispatchScoreboardEvent("scoreboard_update",vp,"vp");
	}
	#MakeForm()
	{
		let column_one = document.createElement("div");
		column_one.classList.add('column')
		for (let asset of this.#assets.GetKeys())
		{
			let row = document.createElement("div");
			row.classList.add("row")
			let buttons = [-5,-1,0,1,5]; // 0 represents our display element here
			for(let amnt of buttons)
			{
				if(amnt == 0)
				{
					const container = document.createElement("div");
					const span = document.createElement("span", {is:"dynamic-value"});
					span.asset_id=asset;
					span.innerText = this.#assets.GetAsset(asset)
					
					const tag = document.createElement("span");
					tag.innerText = DISPLAY_NAME[asset] + ": ";
					container.appendChild(tag)
					container.appendChild(span);
					row.appendChild(container);
				}
				else
				{
					const button = document.createElement("button", {is: "increment-button"})
					button.asset_id = asset;
					button.amount = amnt;
					button.innerText = amnt;
					if(amnt > 0)
						button.classList.add("positive");
					else
						button.classList.add("negative");
					row.appendChild(button);
				}
			}
			column_one.appendChild(row);
		}
		const column_two = document.createElement('div');
		column_two.classList.add('column')
		const clr = document.createElement("button");
		clr.innerText = "Reset";
		clr.classList.add("negative"); // So it is red
		clr.onclick = (e)=>{
			if(window.confirm("Confirm: Reset board?"))
				this.#Reset();
		}
		const tag = document.createElement("span");
		tag.innerHTML = "&nbsp;Final VP:&nbsp;";
		const vp = document.createElement("span", {is:"dynamic-value"});
		vp.asset_id = "vp"; // #updateVP will assign the value to this next in constructor
		column_two.appendChild(clr);
		column_two.appendChild(tag);
		column_two.appendChild(vp);

		this.#board.appendChild(column_one);
		this.#board.appendChild(column_two);
	}
	#Reset()
	{
		this.#assets = new Assets();
		this.#SetLocalStorage();
		this.#board.innerHTML = "";
		this.#MakeForm();
		this.#UpdateVP();
	}

}


window.onload = () => {
	const myBoard = new Scoreboard("scoreboard");
	
}
