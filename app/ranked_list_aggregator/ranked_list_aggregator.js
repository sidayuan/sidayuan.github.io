// Input method
document.getElementById("input-selector").addEventListener("change", function() {
    switch (document.getElementById("input-selector").value) {
        case "none":
            document.getElementById("text-input").style.display = 'none';
            document.getElementById("csv-instructions").style.display = 'none';
            document.getElementById("csv-upload").style.display = 'none';
            document.getElementById("orientation").style.display = 'none';
            document.getElementById("aggregate-button").style.display = 'none';
            break;
        case "text-input":
            document.getElementById("text-input").style.display = 'block';
            document.getElementById("csv-instructions").style.display = 'none';
            document.getElementById("csv-upload").style.display = 'none';
            document.getElementById("orientation").style.display = 'none';
            document.getElementById("aggregate-button").style.display = 'block';
            break;
        case "csv-upload":
            document.getElementById("csv-upload").value = ''
            document.getElementById("text-input").style.display = 'none';
            document.getElementById("csv-instructions").style.display = 'block';
            document.getElementById("csv-upload").style.display = 'block';
            document.getElementById("orientation").style.display = 'none';
            document.getElementById("aggregate-button").style.display = 'none';
            break;
    }
})

const fileInput = document.getElementById("csv-upload")

fileInput.addEventListener("change", function(event) {
    if (fileInput.length == 0) {
      document.getElementById("orientation").style.display = 'none';
      document.getElementById("aggregate-button").style.display = 'none';
    } else {
      document.getElementById("orientation").style.display = 'block';
      document.getElementById("aggregate-button").style.display = 'block';
    }
});

let results = null;

document.getElementById("aggregate-button").addEventListener("click", aggregateRankings);

document.getElementById('download-button').addEventListener('click', downloadCSV);

async function aggregateRankings() {
    results = await aggregate();

    if ((results == null) || (results.length == 0)) { // if user tries to aggregate on empty
      document.getElementById('output').innerHTML = '';
      document.getElementById("download-button").style.display = 'none';
      return null;
    }

    // build table
    let output = '<table><tr><th>Rank</th><th>Item</th><th>Rank weights</th></tr>';
    results.forEach(row => {
      output += `<tr><td>${row.preferential_voting_rank}</td><td>${row.item}</td><td>${row.value}</td></tr>`;
      });
      output += '</table>';
  
      // output table
      document.getElementById('output').innerHTML = output;

      // show download CSV button
      document.getElementById("download-button").style.display = 'block';
}

async function aggregate() {
    selectorMethod = document.getElementById("input-selector").value;
    let data = null;
    if (selectorMethod == "text-input") {
        data = getTextData();
    } else if(selectorMethod == "csv-upload") {
        data = await handleCSV();
    }

    if ((data == null) || (data.length == 0)) {
        console.log("Error: Something went wrong with the data input.");
        alert("Error: Something went wrong with the data input.");
        return null;
    }

    const winThreshold = Math.floor(data.length / 2) + 1;
    
    // unique items
    const items = new Set();
    data.forEach(personRanking => {
      personRanking.forEach(item => items.add(item));
    });
    const itemList = Array.from(items);

    const rounds = Math.max(...data.map(list => list.length));

    // quadratic weights
    const weights = Array.from({ length: rounds }, (_, i) => (1 - (i / rounds)) ** 2);
    let ranking = []; // initialising final rankings
  
    // initialize votes
    const votes_df = itemList.map(item => ({
      item: item,
      votes: 0,
      value: 0
    }));
  
    // iterate through each preference rank
    for (let i = 0; i < rounds; i++) {
      const itemsThisRank = data.filter(person => person.length > i).map(person => person[i]);
  
      // count occurrences of each item
      const counts = new Map();
      itemsThisRank.forEach(item => {
        counts.set(item, (counts.get(item) || 0) + 1);
      });
  
      // update votes_df with the counts and weighted values
      counts.forEach((count, item) => {
        const voteIndex = votes_df.findIndex(vote => vote.item === item);
        if (voteIndex !== -1) {
          votes_df[voteIndex].votes += count;
          votes_df[voteIndex].value += count * weights[i];
        }
      });
  
      // if it's not the last round, update the ranking if we have winners
      if (i < rounds - 1) {
        const winners_df = votes_df
          .filter(vote => vote.votes >= winThreshold)
          .sort((a, b) => b.votes - a.votes || b.value - a.value);
  
        const newWinners = winners_df.filter(winner => !ranking.includes(winner.item));
        if (newWinners.length > 0) {
          ranking.push(...newWinners.map(winner => winner.item));
        }
      } else {
        // final round, rank all remaining items that didn't reach win threshold
        const winners_df = votes_df
          .sort((a, b) => b.votes - a.votes || b.value - a.value);
  
        const newWinners = winners_df.filter(winner => !ranking.includes(winner.item));
        ranking.push(...newWinners.map(winner => winner.item));
      }
    }
  
    // putting together results
    const results_df = ranking.map((item, index) => {
      const vote = votes_df.find(vote => vote.item === item);
      return {
        preferential_voting_rank: index + 1,
        item: item,
        value: Math.round(vote.value * 100) / 100 // round
      };
    });
  
    return results_df;
}

function getTextData() {
    const textInput = document.getElementById("text-input").value;
    let data = textInput.
        split('\n'). // broken into rows
        filter(line => line.trim() !== '') // get rid of empty lines
        .map(line => line.split(',').map(cell => cell.trim().toLowerCase())); // comma separation and cleaning
    return data;
}

async function handleCSV() {
  try {
      const cells = await getCSVData();
      return cells;
  } catch (error) {
      console.error('Error reading the CSV file:', error);
  }
}

function getCSVData() {
    return new Promise((resolve, reject) => {
        const file = fileInput.files[0]; // Get the first selected file
        const reader = new FileReader();

        reader.onload = function(event) {
            const csvContent = event.target.result;

            // split the CSV content by newlines to get rows
            const rows = csvContent.split('\n').map(row => row.trim()).filter(row => row !== '');

            // split each row by commas to get the cells
            let cells = rows.map(row => row.split(',').map(cell => cell.trim().toLowerCase()));

            if (document.getElementById("csv-orientation").value == "column") { cells = transpose(cells); } // transpose the rows into columns
            
            // Resolve the promise with the cells data
            resolve(cells);
        };

        reader.onerror = function(error) {
            reject(error); // Reject the promise if there's an error reading the file
        };

        if (file == undefined) { return null; }

        reader.readAsText(file);
    });
}

function transpose(array) {
    const columns = [];
    const rowCount = array.length;
    const colCount = array[0].length;

    for (let col = 0; col < colCount; col++) {
        const column = [];
        for (let row = 0; row < rowCount; row++) {
            column.push(array[row][col]);
        }
        columns.push(column);
    }

    return columns;
}

function convertToCSV(data) {
  if ((data == undefined) || (data == null) || (data.length == 0)) {
    return null;
  }
  const headers = ['rank', 'item', 'rank weight'];
  const rows = data.map(item => {
      return [item.preferential_voting_rank, item.item, item.value].join(',');
  });

  // join headers and rows
  return [headers.join(','), ...rows].join('\n');
}

// function to trigger CSV download
function downloadCSV() {
  const csv = convertToCSV(results);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aggregate_rankings.csv'; // filename
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // clean up the object URL
}
