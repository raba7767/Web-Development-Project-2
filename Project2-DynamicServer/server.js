// Built-in Node.js modules
var fs = require('fs')
var path = require('path')

// NPM modules
var express = require('express')
var sqlite3 = require('sqlite3')


var public_dir = path.join(__dirname, 'public');
var template_dir = path.join(__dirname, 'templates');
var db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

var app = express();
var port = 8000;

// open usenergy.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.use(express.static(public_dir));


// GET request handler for '/'
app.get('/', (req, res) => {
    ReadFile(path.join(template_dir, 'index.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
        Testsql();
    });
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {	
    ReadFile(path.join(template_dir, 'year.html')).then((template) => {		
		let sql = "SELECT * FROM Consumption WHERE year="+req.params.selected_year;
		let coal_count=0;
		let natural_gas_count=0;
		let nuclear_count=0;
		let petroleum_count=0;
		let renewable_count=0;
		db.all(sql, [], (err, rows) => {
			if (err) {
				throw err;
			}
			//Length of query, should be 51 for the 50 states + Washington DC
			let length = Object.keys(rows).length;
			console.log("LENGTH: " + length);
			//Table data that will be inserted in consumption by state table
			let table_data="";
			for(i = 0; i < length; i++){
				//Start new row in table
				table_data=table_data+"<tr>";
				
				//1st column in table is the state 
				table_data=table_data+"<td>"+rows[i].state_abbreviation+"</td>";
				
				//Update total coal amount for pie chart
				coal_count = coal_count+rows[i].coal;
				//2nd column in table is coal
				table_data=table_data+"<td>"+rows[i].coal+"</td>";
				
				//Update total natural gas amount for pie chart
				natural_gas_count = natural_gas_count+rows[i].natural_gas;
				//3rd column in table is natural gas
				table_data=table_data+"<td>"+rows[i].natural_gas+"</td>";
				
				//Update total nuclear amount for pie chart
				nuclear_count = nuclear_count+rows[i].nuclear;
				//4th column in table is nuclear
				table_data=table_data+"<td>"+rows[i].nuclear+"</td>";
				
				//Update total petroleum amount for pie chart
				petroleum_count = petroleum_count+rows[i].petroleum;
				//5th column in table is petroleum
				table_data=table_data+"<td>"+rows[i].petroleum+"</td>";
				
				//Update total renewable amount for pie chart
				renewable_count = renewable_count+rows[i].renewable;
				//6th column in table is renewable
				table_data=table_data+"<td>"+rows[i].renewable+"</td>";
				
				//7th (last) column in table is total energy usage
				let total=(rows[i].coal + rows[i].natural_gas + rows[i].nuclear + rows[i].petroleum + rows[i].renewable);
				table_data=table_data+"<td>"+total+"</td>";
				
				//End this table row
				table_data=table_data+"</tr>";
			}			

			let response = template.toString();
			// modify `response` here
			// modify title
			response=response.replace("<title>US Energy Consumption</title>", req.params.selected_year+" US Energy Consumption");
			// modify variables
			response=response.replace("var year", "var year="+req.params.selected_year);
			response=response.replace("var coal_count", "var coal_count="+coal_count);
			response=response.replace("var natural_gas_count", "var natural_gas_count="+natural_gas_count);
			response=response.replace("var nuclear_count", "var nuclear_count="+nuclear_count);
			response=response.replace("var petroleum_count", "var petroleum_count="+petroleum_count);
			response=response.replace("var renewable_count", "var renewable_count="+renewable_count);
			//modify table
			response=response.replace("<!-- Data to be inserted here -->", table_data);
			
			WriteHtml(res, response);
		});
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
	console.log("SELECTED STATE: " + req.params.selected_state);
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
	console.log("SELECTED ENERGY TYPE: " + req.params.selected_energy_type);
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

function ReadFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.toString());
            }
        });
    });
}

function Write404Error(res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error: file not found');
    res.end();
}

function WriteHtml(res, html) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}

function TestSql()
{
db.each("SELECT * FROM Consumption WHERE state_abbreviation = ? ORDER BY year",["MN"],(err, rows)=>
{
	console.log(rows);
});
}

var server = app.listen(port);
