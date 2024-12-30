---
layout: compact
title: "Ranked list aggregator"
description: An app that aggregates personal ranked lists into a group preference ranking. Perfect for democratic decision-making or just for fun. Try it now!
---

<link rel="stylesheet" href="style.css">

# Ranked list aggregator

Let's say you have a group of friends, and each person has a ranking of their favourite movies of all time. You want to determine a ranking that best captures your collective taste in movies. Well buddy, this one's for you.

This app aggregates rankings using <i>iterated preferential voting with quadratic rank weights</i>.

<br>

<div id="input">
<b>Input method</b>
<select name="Select input method" id="input-selector">
<option value="text-input" selected>Text field</option>
<option value="csv-upload">CSV file</option>
</select>

<textarea name="message" id="text-input" placeholder="Enter ranked lists" style="width: 100%; height: 200px;">Hot Fuzz, Zoolander, Wayne's World
Zoolander, Wayne's World, The Godfather, Hot Fuzz
Zoolander, Mulholland Drive, Wayne's World, Hot Fuzz</textarea>

<p id="csv-instructions">CSV file must only have the ranked items - no names!</p>

<input type="file" id="csv-upload" accept=".csv">

<p id="orientation">
<b>Individual rankings are oriented as</b>
<select name="Orientation" id="csv-orientation">
<option value="column" selected>columns</option>
<option value="row">rows</option>
</select>
</p>


<button id="aggregate-button">Aggregate</button>

</div>

<br>

<div id="output"></div>

<button id="download-button">Download CSV</button>

<script src="ranked_list_aggregator.js"></script>
