import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSnapshotHTML, snapshotFilename} from './flightSnapshot.js';
import {buildFlightReport} from './flightReport.js';
import {calculateFlightScore} from './flightScoreCalculator.js';
test('saved checkpoint contains exact dated inputs, canonical action and reflection without active content',()=>{
 const report=buildFlightReport(calculateFlightScore({income:6000,needs:3400.01,wants:1200,savings:500,extraDebtPayment:250,totalDebtBalance:18120,emergencyFundSaved:4000,emergencyFundGoal:8000,investmentsCurrentValue:2500}),{flightDate:'2026-12-15'});
 const html=buildSnapshotHTML(report);
 assert.match(html,/Dec 15, 2026/); assert.match(html,/Jan 14, 2027/); assert.match(html,/\$3,400.01/);
 assert.ok(html.includes(report.oneMove.text)); assert.equal((html.match(/<dt>/g)||[]).length,15);
 assert.match(html,/What action did I take/); assert.match(html,/form-action 'none'/);
 assert.doesNotMatch(html,/<script|<form|<iframe|<img|<link|https?:\/\//i);
 assert.match(snapshotFilename(report),/^FFM-Flight-Report-.*\.html$/);
 report.oneMove.text='<img src=x onerror=alert(1)>';
 assert.ok(buildSnapshotHTML(report).includes('&lt;img')); assert.doesNotMatch(buildSnapshotHTML(report),/<img/);
});
