/**
 * revenueByDate.js
 * mmccawley@us.ibm.com   2025-05-01
 * A command-line nodejs script to compute a fact from JSON
 * 
 * See requirements in Cognitive Tooling Code and Data Challenge.docx
 * 
 */

const module_name = 'revenueByDate.js';
const module_version = "1.0.0";
const module_author = 'mmccawley@us.ibm.com';
const module_date = '2025-05-01';

const usageMessage = `\n

${module_name} ${module_version} ${module_author} ${module_date}
One off script to compute something from a JSON file input.

USAGE:  $ node ${module_name} <data-file>

WHERE:    
    <data-file> is the path to json file containing the data to be
    processed.
`;


// is there a data-file specified?
const dataFileName = process.argv.slice(2,3)[0];
console.log(`${(new Date()).toISOString()}\tINFO:  dataFileName=${dataFileName}`);

if (!dataFileName) {
    console.err(`${(new Date()).toISOString()}\tERROR:  dataFileName required.`);
    console.err(`${usageMessage}`);
    process.exit(1);
}

//whole thing in memory.  TODO: stream processor.

import * as fs from 'fs';
const invoices = JSON.parse(fs.readFileSync(dataFileName));  //TODO: error handler

/**
 * Use Case:  Compute Revenue (Sales) for November 2021.
 * 
 * Iterate Records
 * Filter on InvoiceDate startswith "2021-11"
 * Sum all the (InvoiceLines.Quantity)*(InvoiceLines.UnitPrice)
 */
let total = 0;
let invoiceCount = 0;
let lineCount = 0;
for (const invoice of invoices) {
    if (!invoice.InvoiceDate.startsWith("2021-11")) continue;
    invoiceCount++;
    for (const line of invoice.InvoiceLines) {
        lineCount++;
        total += line.Quantity * line.UnitPrice;
    }
}

console.log(`Matching Invoices:${invoiceCount}`);
console.log(`Matching Line Items:${lineCount}`);
console.log(`Total Sales:${total}`);
