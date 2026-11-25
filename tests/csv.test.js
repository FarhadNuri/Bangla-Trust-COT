import test from "node:test";
import assert from "node:assert/strict";
import { toCsvCell, buildCsv } from "../src/lib/csv.js";

test("toCsvCell: converts primitive types and nulls correctly", () => {
  assert.equal(toCsvCell(null), "");
  assert.equal(toCsvCell(undefined), "");
  assert.equal(toCsvCell(true), "1");
  assert.equal(toCsvCell(false), "0");
  assert.equal(toCsvCell(42), "42");
  assert.equal(toCsvCell(0), "0");
  // Negative numbers as numeric types must NOT be prefixed with single quote
  assert.equal(toCsvCell(-1), "-1");
  assert.equal(toCsvCell(-2.5), "-2.5");
});

test("toCsvCell: handles formula injection for strings starting with =, +, -, @", () => {
  assert.equal(toCsvCell("=SUM(A1)"), "'=SUM(A1)");
  assert.equal(toCsvCell("+123"), "'+123");
  assert.equal(toCsvCell("-cmd"), "'-cmd");
  assert.equal(toCsvCell("@alert"), "'@alert");
  assert.equal(toCsvCell("Normal Text"), "Normal Text");
});

test("toCsvCell: escapes commas, double quotes, and newlines per RFC 4180", () => {
  assert.equal(toCsvCell("Hello, World"), '"Hello, World"');
  assert.equal(toCsvCell('He said "Hi"'), '"He said ""Hi"""');
  assert.equal(toCsvCell("Line 1\nLine 2"), '"Line 1\nLine 2"');
  assert.equal(toCsvCell("Line 1\r\nLine 2"), '"Line 1\r\nLine 2"');
  assert.equal(toCsvCell("=SUM(A1, B1)"), '"\'=SUM(A1, B1)"');
});

test("toCsvCell: preserves Bangla script characters unchanged", () => {
  assert.equal(toCsvCell("বাংলা ধাঁধা"), "বাংলা ধাঁধা");
  assert.equal(toCsvCell("নীল হাতি"), "নীল হাতি");
});

test("buildCsv: produces UTF-8 BOM, correct header, row values, and \\r\\n line endings", () => {
  const columns = ["id", "name", "note", "active"];
  const rows = [
    { id: 1, name: "Farhad", note: "Normal note", active: true },
    { id: -1, name: "মুনতাহা", note: "=1+1", active: false },
    { id: 2, name: 'Quoted "Name"', note: "Line 1\nLine 2", active: true },
  ];

  const csv = buildCsv(columns, rows);

  // 1. Starts with UTF-8 BOM (\uFEFF)
  assert.ok(csv.startsWith("\uFEFF"));

  // 2. Lines separated by \r\n
  const lines = csv.slice(1).split("\r\n");
  assert.equal(lines[0], "id,name,note,active");
  assert.equal(lines[1], "1,Farhad,Normal note,1");
  assert.equal(lines[2], "-1,মুনতাহা,'=1+1,0");
  assert.equal(lines[3], '2,"Quoted ""Name""","Line 1\nLine 2",1');
  assert.equal(lines[4], ""); // Trailing \r\n produces empty last item
});
