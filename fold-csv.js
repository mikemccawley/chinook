/**
 * fold-records.js
 * mmccawley@us.ibm.com   2025-05-01
 * A command-line nodejs script to transform a flattened csv into an array
 * of JSON records.
 * 
 * See requirements in Cognitive Tooling Code and Data Challenge.docx
 * 
 */

const module_name = 'fold-records.js';
const module_version = "1.0.0";
const module_author = 'mmccawley@us.ibm.com';
const module_date = '2025-05-01';

const usageMessage = `\n

${module_name} ${module_version} ${module_author} ${module_date}
Script to transform a csv file into an array of data objects, representing
Invoice records with an array of InvoiceLines each, for prompting an LLM.

USAGE:  $ node ${module_name} <data-file>

WHERE:    
    <data-file> is the path to a csv file containing the data to be
    processed.
`;

//obtain this once in the event of long-running jobs
const started = (new Date()).toISOString().substring(0, 10);
console.log(`${module_name} ${module_date} has started at ${started}.`);
console.log(`${(new Date()).toISOString()}\t${module_name} Setting up...`);

import fs from 'node:fs';
import csv from 'fast-csv';    // nice library 
import _ from 'lodash';        // toolkit of array functions

// is there a data-file specified?
const dataFileName = process.argv.slice(2,3)[0];  // what did I just do here? Love it or hate it?
console.log(`${(new Date()).toISOString()}\tINFO:  dataFileName=${dataFileName}`);

if (!dataFileName) {
    console.err(`${(new Date()).toISOString()}\tERROR:  dataFileName required.`);
    console.err(`${usageMessage}`);
    process.exit(1);
}

/**
 * Folds InvoiceLines records into Lines.
 * @param {Object} df_in Input data frame.
 * @return {Object} Output data frame.
 */
function foldRecords(df_in) {
	let this_Invoice = {};
	let df_out = [];   // will return this

	// get unique InvoiceIds.  I know they are sequential in this one example
    // but it's risky to depend on that.  Let the data tell you what needs to 
    // be processed.  Took a shortcut and used lodash unique.
	let unique = _.uniqBy(df_in, "InvoiceId");
	console.log(`${(new Date()).toISOString()}\tINFO:  uniqueCount=${unique.length}`);

	for (const o of unique) { 
		let lines = [];	
		this_Invoice = {
			"InvoiceId": o.InvoiceId,
			"CustomerId": o.CustomerId,
			"InvoiceDate": o.InvoiceDate
		};

		// select the rows of df_in that match this unique InvoiceId
		const filtered = _.filter(df_in, ['InvoiceId', o.InvoiceId]);
		console.log(`${(new Date()).toISOString()}\tINFO:  ${o.InvoiceId}.InvoiceLines.length=${filtered.length}`);

		for (const row of filtered) {
			let this_line = {
				"TrackId": row.TrackId,
				"Quantity": row.Quantity,
                "UnitPrice": parseFloat(row.UnitPrice) 
			};
			lines.push(this_line);
		}
		this_Invoice.InvoiceLines = lines;
		df_out.push(this_Invoice);
	}
	return df_out;
}


/*********************************
 *
 *     M A I N 
 * Process csv as a stream.
 *
 */

// df will be an array of objects (a DataFrame)
let df = [];

// these options match the format of the CSV file
// I expect, given the documentation of the challenge
const options = {
	headers: true,
	quote: '"',
	delimiter: ',',
};

fs.createReadStream(dataFileName)
.pipe(csv.parse(options))
.on("data", (data) => {
	df.push(data);
})
.on("error", (error) => {
	console.log(`${(new Date()).toISOString()}\tERROR:  csv.parse Error: ${error}`);
})
.on("end", () => {

    const transformed = foldRecords(df);
    // write file - sync.  I should stream the output to the open file record at a time, 
    // but the expected output documented in the challenge is proper JSON (brackets)
    // and not JSONL.  JSONL would be better.
	const outFileName = `${dataFileName.substring(0, dataFileName.length-4)}-transformed.json`;
	console.log(`${(new Date()).toISOString()}\tINFO:  ----- writing outfile ${outFileName} -----\n\n`);
	try {
		fs.writeFileSync(outFileName, JSON.stringify(transformed, null, 2));
	} catch (err) {
		console.error(err);
	}
})
