/// <reference path="../dist/poop.d.ts" />
/// <reference path="./index.d.ts" />


window.fetch = require('cross-fetch');
const fs = require('fs');

// Jest really hates imports, gotta do something with that
// import fs from 'fs';
// import tsd, { expectType } from 'tsd';

const html = fs.readFileSync('./test/document.html', 'utf-8');

function typecheck(f) {
	return async () => {
		// const tempDefinitionFile = './test/temp.d.ts';
		// fs.writeFileSync(tempDefinitionFile, `

		// 	\n${f}
		// `);
		// // let tsd = require('tsd');
		// let diagnostics = await tsd({
		// 	cwd: process.cwd(),
		// 	testFiles: [tempDefinitionFile],
		// });
		// throw diagnostics;
		// fs.unlinkSync(tempDefinitionFile);
	}
}

// function expectType(value) {};

test('__init__', () => {
	expect(window).toHaveProperty('__init__');
});

describe('querySelector', () => {
	beforeEach(() => {
		document.write(html);
		document.close();
	});

	test('should work on global', () => {
		expect(q('x')).toBeNull();
		expect(q('b').innerHTML).toBe('just b');
	});
	test('should work on window', () => {
		expect(window.q('x')).toBeNull();
		expect(window.q('b').innerHTML).toBe('just b');
	});
	test('should work on document', () => {
		expect(document.q('x')).toBeNull();
		expect(document.q('b').innerHTML).toBe('just b');
	});
	test('should work on elements', () => {
		expect(q('tr:nth-child(2)').q('x')).toBeNull();
		expect(q('tr:nth-child(2)').q('td').innerHTML).toBe('td 3');
	});

	test('should have proper typings', typecheck(() => {
		expectType<HTMLAnchorElement>(q('a'));
	}));
});

describe('querySelectorAll', () => {
	beforeEach(() => {
		document.write(html);
		document.close();
	});
	let bs = ["just b", "b with id", "b with class", "b with attr"];

	test('should work on global', () => {
		expect(qq('td:nth-last-child(1)').map(e => e.innerHTML)).toEqual(['td 2', 'td 4']);
	});
	test('should work on window', () => {
		expect(window.qq('b').map(e => e.innerHTML)).toEqual(bs);
	});
	test('should work on document', () => {
		expect(document.qq('b').map(e => e.innerHTML)).toEqual(bs);
	});
	test('should work on elements', () => {
		expect(q('tr:nth-child(2)').qq('td').map(e => e.innerHTML)).toEqual(['td 3', 'td 4']);
	});
});

describe('elm', () => {
	const elmHtml = (...a) => elm(...a).outerHTML;
	test('should create empty divs', () => {
		const divHtml = `<div></div>`;
		expect(elm().outerHTML).toBe(divHtml);
		expect(elm('').outerHTML).toBe(divHtml);
		expect(elm('div').outerHTML).toBe(divHtml);
	});
	test('should create any tags', () => {
		expect(elm('a').outerHTML).toBe('<a></a>');
		expect(elm('br').outerHTML).toBe('<br>');
		expect(elm('img').outerHTML).toBe('<img>');
	});
	test('should add classes, tags and attributes', () => {
		expect(elm('#a.b[c=d]').outerHTML).toBe('<div id="a" class="b" c="d"></div>');
		expect(elm('a[href=#123]').outerHTML).toBe('');
	});
	test('should add children', () => {
		expect(elm('buttonHALP', '2'))
	});
	test('should add listeners', () => {

	});
	test('should work with everything mixed up', () => {

	});






});
