summaryInclude=60;

const t_kw       = 1;
const t_ti       = 2;
const t_kw_ti    = 3;
const t_au       = 4;
const t_kw_au    = 5;
const t_ti_au    = 6;
const t_kw_ti_au = 7;
const t_none     = 0;

const qot = '\"'; //escaped double-quote for phrase search
const eqsign = "=";
let daterange = [];


var fuseOptions = {
  useExtendedSearch: true,
  shouldSort:        true,
  includeMatches:    true,
  findAllMatches:    true,
  threshold:         0.0,
  tokenize:          true,
  location:          0,
  ignoreLocation:    true,
  //distance:        100,
  maxPatternLength:  32,
  minMatchCharLength: 3,

  keys: [
    {name:"author", weight:0.9},
    {name:"title", weight:0.8},
    {name:"contents", weight:0.5},
    {name:"doctype", weight:0.5},
    {name:"year", weight:0.5}
  ] 
  
};


var kwordQuery = param("kword");
var titleQuery = param("title");
var authorQuery = param("author");

var doctypeFilter = param("doctype");
var yearbeginFilter = param("yearbegin");
var yearendFilter = param("yearend");

let searchQuery = {};
var matrix = 0;

if (kwordQuery) {
    matrix += t_kw;  
    //searchQuery.push(kwordQuery);
    $("#search-query").val(kwordQuery);
}

if (titleQuery) {
    matrix += t_ti;  
    //searchQuery.push(titleQuery);
    $("#searchtitle").val(titleQuery);
}

if (authorQuery) {
    matrix += t_au;  
    //searchQuery.push(authorQuery);
    $("#searchauthor").val(authorQuery);
}

if (doctypeFilter) {
    //searchQuery.push(doctypeFilter);
    $("#searchdoctype").val(doctypeFilter);
}
if (yearbeginFilter) {
    //daterange.push(yearbeginFilter);
    $("#searchyearbegin").val(yearbeginFilter);
}
if (yearendFilter) {
    //daterange.push(yearendFilter);
    $("#searchyearend").val(yearendFilter);
}

console.log("matrix = " + matrix);

switch (matrix) {
    case t_kw:
      searchQuery = {
        //    $and: kwordQuery.split(/\s+/).map(key => ({ [key]: word }))
        //    $and: kwordQuery.split(/\s+/).map(word => ({ contents: word }))
        //    $and: [{ options.keys.map(key => ({ [key]: term })) }]
        $or: [ { title: kwordQuery }, { author: kwordQuery }, { contents: kwordQuery } ] 
      };
        //searchQuery = kwordQuery;
        break;
    case t_ti:
	searchQuery = { 
            $and: [{ title: qot + titleQuery + qot }] 
        };
        //searchQuery = { title:  qot + titleQuery + qot };
        break;
    case t_au:
	searchQuery = { 
            $and: [{ author: qot + authorQuery + qot }] 
        };
        // searchQuery = { author: qot + authorQuery + qot};
        break;
    case t_kw_ti:
        //searchQuery = { $and: [{ contents: kwordQuery }, { title: titleQuery }] };
        searchQuery = {
            $and: [
                { $or: [ { title: kwordQuery }, { author: kwordQuery }, { contents: kwordQuery } ] },
                { title: titleQuery }
            ]
        };
        break;
    case t_kw_au:
        //searchQuery = { $and: [{ contents: kwordQuery }, { author: authorQuery }] };
        searchQuery = {
            $and: [
                { $or: [ { title: kwordQuery }, { author: kwordQuery }, { contents: kwordQuery } ] },
                { title: authorQuery }
            ]
        };
        break;
    case t_ti_au:
        searchQuery = { $and: [{ title: titleQuery }, { author: authorQuery }] };
        break;
    case t_kw_ti_au:
        searchQuery = {
            $and: [
                { $or: [ { title: kwordQuery }, { author: kwordQuery }, { contents: kwordQuery } ] },
                { title: titleQuery },
                { author: authorQuery }
            ]
        };

        break;
    default:
	matrix = t_none; //is this needed?

} //end switch!

//There is an existing  search term, so push doctype filter onto it. --DRV
if (doctypeFilter) {
    if (matrix) {	
        searchQuery.$and.push( {doctype: doctypeFilter} ); //There is an existing query; push filter onto it
	console.log("Push doctype filter onto query.");
    } else {
        searchQuery = doctypeFilter; //No existing query; simply set the filter as a query
	console.log("Set doctype filter as query.");
    }
}

console.log("searchQuery is: " + JSON.stringify(searchQuery));
//console.log("searchQuery is: " + searchQuery);


if (searchQuery) {
  executeSearch(searchQuery, daterange);
} 
else {
  $('#search-results').append("<p>Search by name, location, or phrase above.</p>");
}


function executeSearch(fullQuery){
    $.getJSON( "/index.json", function( data ) {
    console.log("fullQuery is: " + JSON.stringify(fullQuery));
    var pages = data;
    var fuse = new Fuse(pages, fuseOptions);
    //var fullQuery = searchQuery.join(" ").toString(" ");	  
    var result = fuse.search(fullQuery);
    //var filteredResult = result;


  if (doctypeFilter && (matrix === t_none) ) {
        filteredResult = result.filter(item => item.item.doctype === doctypeFilter);
	console.log("doctype-filter only");
    } else {
	filteredResult = result;
    }

    console.log("filtered results: ", filteredResult);
	    
    if (yearbeginFilter || yearendFilter ) {
	let y_beg = Number(yearbeginFilter);
	let y_end = Number(yearendFilter);    

        console.log("=============================================");
	console.log("  Year Filter(s) selected");
	console.log("  begin_yr: ", yearbeginFilter, "end_yr: ", yearendFilter);    
        console.log("=============================================");

	filteredResult = filteredResult.filter(item => {

            let year = item.item.year; // Extract year
	    console.log("Year is: ", year);
            let lobound = year >= y_beg;
            let hibound  = year <= y_end;

            if (y_beg && y_end) {
                console.log("Between ", y_beg, " and ", y_end, ": " , lobound && hibound);
		if (lobound && hibound) { console.log("HIT within range!");}
	        console.log("_____________________________________");
                return lobound && hibound;
            } else if (y_beg)  {
                console.log(year, " >= ", y_beg, " : ", lobound);
		if (lobound) { console.log("HIT above low-bound!");}
	        console.log("_____________________________________");
                return lobound;
            } else if (y_end) {
                console.log(year, " <= ", yearendFilter, " : ", hibound);
		if (hibound) { console.log("HIT under hi-bound!");}
	        console.log("_____________________________________");
                return hibound;
            }
            
            return true; // Should never reach here
        });
}
    console.log("filtered results: ", filteredResult);





/*  // Questionable tactic!  Do we really need full timestamps? Use year!
    // Convert dates to timestamps
    const filteredData = data.map(year => ({
      ...year,
      timestamp: Date.parse(year.date)
    }));

    if (drange.length) {
	console.log("daterange is:" + drange)
	let annum = "year";
	let d1 = drange.at(0);
	let d2 = drange.at(1);
	if (d2) { ++d2;}    
	console.log("dates are: " + d1, d2)

	const datebegin = Date.parse(d1.toString() + "-01-01");
	const dateend = Date.parse(d2.toString() + "-01-01");
	console.log("parsed dates are: " + datebegin, dateend)

	result = result.filter(result => {
	    const yearTimeStamp = annum;
            yearTimeStamp >= datebegin && yearTimeStamp <= dateend;
	    console.log("filtered result:", result)
	});
    }
*/
    console.log({"matches":result});
    if(result.length > 0){
      //populateResults(result);
      populateResults(filteredResult);
    }else{
      $('#search-results').append("<p>No matches found</p>");
    }
  });
}

function populateResults(result){
  $.each(result,function(key,value){
    var contents= value.item.contents;
    var snippet = "";
    var snippetHighlights=[];
    var tags =[];
    if( fuseOptions.tokenize ){
      //snippetHighlights.push(searchQuery); //venckus temp disabled, due to jquery.mark.min.js incompatibility
    }else{
      $.each(value.matches,function(matchKey,mvalue){
        if(mvalue.key == "tags" || mvalue.key == "categories" ){
          snippetHighlights.push(mvalue.value);
        }else if(mvalue.key == "contents"){
          start = mvalue.indices[0][0]-summaryInclude>0?mvalue.indices[0][0]-summaryInclude:0;
          end = mvalue.indices[0][1]+summaryInclude<contents.length?mvalue.indices[0][1]+summaryInclude:contents.length;
          snippet += contents.substring(start,end);
          snippetHighlights.push(mvalue.value.substring(mvalue.indices[0][0],mvalue.indices[0][1]-mvalue.indices[0][0]+1));
        }
      });
    }

    if(snippet.length<1){
      snippet += contents.substring(0,summaryInclude*2);
    }
    //pull template from hugo templarte definition
    var templateDefinition = $('#search-result-template').html();
    //replace values
    var output = render(templateDefinition,{key:key,title:value.item.title,link:value.item.permalink,tags:value.item.tags,categories:value.item.categories,snippet:snippet});
    $('#search-results').append(output);

    $.each(snippetHighlights,function(snipkey,snipvalue){
      $("#summary-"+key).mark(snipvalue);
    });

  });
}

function param(name) {
    return decodeURIComponent((location.search.split(name + '=')[1] || '').split('&')[0]).replace(/\+/g, ' ');
}

function render(templateString, data) {
  var conditionalMatches,conditionalPattern,copy;
  conditionalPattern = /\$\{\s*isset ([a-zA-Z]*) \s*\}(.*)\$\{\s*end\s*}/g;
  //since loop below depends on re.lastInxdex, we use a copy to capture any manipulations whilst inside the loop
  copy = templateString;
  while ((conditionalMatches = conditionalPattern.exec(templateString)) !== null) {
    if(data[conditionalMatches[1]]){
      //valid key, remove conditionals, leave contents.
      copy = copy.replace(conditionalMatches[0],conditionalMatches[2]);
    }else{
      //not valid, remove entire section
      copy = copy.replace(conditionalMatches[0],'');
    }
  }
  templateString = copy;
  //now any conditionals removed we can do simple substitution
  var key, find, re;
  for (key in data) {
    find = '\\$\\{\\s*' + key + '\\s*\\}';
    re = new RegExp(find, 'g');
    templateString = templateString.replace(re, data[key]);
  }
  return templateString;
}
