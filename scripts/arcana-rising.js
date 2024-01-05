/*
I Rewrote this entire thing to be object oriented, and now the javascript alone is bigger than the original file.
bruh.
TBH, I don't even think it's more readable.
*/

/* Constants */
const DEFAULT_STORE = 
{
    "charm": 1,
    "herb": 1,
    "blood": 1,
    "potion": 1,
    "gold": 1,
    "vp": 0
}
const CONVERSION_VALUES = 
{	// No. of items PER victory point
	charm: 3,
	herb: 3,
	blood: -1,
	potion: 3,
	gold: 1,
	vp: 1
}

class Score
{
//public:
	constructor()
	{
		this.#FetchLocalStorage();
		this.#UpdateVP();
	}
	// Accessors
	GetScore(item_name)
	{
		// Gets store value
		return this.#store[item_name]
	}
	GetScores()
	{
		return this.#store;
	}
	// Mutators
	AddScore(item_name, amount)
	{
		this.#SetScore(item_name, this.GetScore(item_name)+amount)
	}
	ClearScore()
	{
		// Resets the score to defaults
		localStorage.removeItem("store");
		this.#FetchLocalStorage();

		// Announce via events to all score-keeping objects
		for(let key of Object.keys(DEFAULT_STORE))
		{
			const event = new CustomEvent(key, {
				detail: this.GetScore(key),
			})
			document.body.dispatchEvent(event);
		}
		this.#UpdateVP();
		const event = new CustomEvent("vp_update", {
			detail: this.vp
		});
		document.body.dispatchEvent(event);
	}
//private:
	#store = {};
	// Mutators
	#UpdateLocalStorage(current_store)
	{
		localStorage.setItem("store", JSON.stringify(current_store));
	}
	#SetScore(item_name, val)
	{
		// Sets a particular item to X
		this.#store[item_name] = val;
		this.#UpdateLocalStorage(this.#store)
		this.#UpdateVP();
		const event = new CustomEvent(item_name, {
			detail: val
		})
		document.body.dispatchEvent(event);
	}
	#UpdateVP()
	{
		let vp = 0;
		for( let key of Object.keys(this.GetScores()))
		{
			var score = this.GetScore(key);
			var division_factor = CONVERSION_VALUES[key];
			vp += Math.floor(score/division_factor)
		}
		this.vp = vp;
		const event = new CustomEvent("vp_update", {
			detail: vp,
		})
		document.body.dispatchEvent(event);
	}
	// Accessors
	#FetchLocalStorage()
	{
		if(localStorage.getItem("store") != null)
		{
			try {
				this.#store = JSON.parse(
					localStorage.getItem("store")
				)
			} catch(e)
			{
				console.error(e);
				console.log("localStorage has been reset to initial values.")
				ClearScore();
			}
			
		}
		else
		{
			// Reset and continue
			this.#UpdateLocalStorage(DEFAULT_STORE)
			this.#FetchLocalStorage();
		}
	}
}

function create_form(form_element, score)
{
	// Clear form
	form_element.innerHTML = "";
	let innerform = document.createElement("div");
	innerform.id = "innerform";
	for (let obj of Object.entries(score.GetScores()))
	{
		let key = obj[0];
		let val = obj[1];

		// Create row
		let row = document.createElement("div");
		row.classList.add("row");

		let buttons = [-5,-1,5,1]
		for(let i in buttons)
		{
			let value = buttons[i];
			let button = document.createElement("button");
			button.onclick = (e) => {
				score.AddScore(key, value);
			}
			button.innerText = value;
			if(value < 0)
				button.classList.add("red");
			else
				button.classList.add("green");
			buttons[i] = button;
		}

		// Create div+span with the individual score:
		let score_output = document.createElement("div");
		score_output.classList.add("mid");
		score_output.innerText = key + ": ";
		let inner_span = document.createElement("span")
		inner_span.innerText = val;

		// Add listener for updates:
		document.body.addEventListener(key, (e)=>
		{
			// Update said value on event
			inner_span.innerText = e.detail;
		})
		score_output.appendChild(inner_span);

		row.appendChild(buttons[0]);
		row.appendChild(buttons[1]);
		row.appendChild(score_output);
		row.appendChild(buttons[2]);
		row.appendChild(buttons[3]);

		innerform.appendChild(row);

	}
	form_element.appendChild(innerform);

	// last couple of items, outside the rows
	let reset = document.createElement("button");
	reset.innerText="Reset"
	reset.classList.add("red")
	reset.onclick = (e)=>{
		// Confirm with user
		if(window.confirm("Confirm: Reset your score?"))
		{
			// Reset Scores
			score.ClearScore();
		}
	}

	let vp = document.createElement("span")
	vp.id = "final_vp"
	vp.innerText = "Final VP: " + score.vp;
	document.body.addEventListener("vp_update",(e)=>{
		vp.innerText = "Final VP: " + e.detail;
	});

    innerform.appendChild(reset)
    form.appendChild(vp);
}


window.addEventListener("load", () => {
    console.log("loaded")
    let score = new Score;
    form = document.getElementById("form");
    create_form(form, score)
});