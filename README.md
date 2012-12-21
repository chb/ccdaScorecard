# C-CDA Scorecard

## Promoting best practices in C-CDA generation

Achieving interoperability with Consolidated CDA documents means agreeing
on "best practices" above and beyond the base specification.  This tool captures
best practices as `rubrics` in code, so you can automatically assess whether
your documents conform.  For example...

### Example Best Practice: "Problem List entries should have one consistent status."

The C-CDA spec provides three distinct places to record a problem status.  The
best practice recommendation is to make sure they all agree!  See below for an
example of a rubric to help automate testing for this best practice.

## Using and Extending

### Setup
* nodejs 
* mongodb
* libxml2

```
$ git clone https://github.com/chb/ccdaScorecard
$ cd ccdaScorecard
$ npm update
```

### Run
`node launch.js`

### Write new and better rubrics
Check out our initial examples in [rubrics](ccdaScorecard/tree/master/rubrics)

### Build a better client
This repo includes a simple example Web UI built agains the CCDA Scorecard REST API.
It's implemented as a static HTML5 / JavaScript Web app at:
[public/ccdaScorecard/index.html](ccdaScorecard/tree/master/public/ccdaScorecard/index.html)

This can serve as a launch point for bigger and better.


## The pieces and the REST API

### Rubrics
`GET /v1/ccda-scorecard/rubrics(/:rubricId)`

Best practices are encoded as scoring `rubrics` that include a description,
scoring table, and some procedural JavaScript code that checks a C-CDA for
conformance to the rubric.  Some rubrics feature Pass/Fail grading, while
others offer A/B/C/D/F grading.  That is, conformance to a rubric may not be
all-or-nothing.  For example there's a rubric to check whether problems have
SNOMED codes.  A problem list containing *mostly* SNOMED codes is **much better**
than a problem list with *none*, and rubrics can take this into account
with A/B/C/D/F grading.

Here's what the JSON description of a rubric might look like:

```js
{
  "id": "problemstatus",
  "description": "Determine whether problem status is expressed consistently",
  "bestPractice": "Each concern act should contain exactly one problem.  If the concern\
                   act status code is 'completed', the problem should have a status\
                   observation with a value of 'Resolved' or 'Inactive'.\
                   If the concern act status code is 'active', the problem\
                   should have a status observation with a value of 'Active'.",
  "grades": {
    "N/A": "Empty problem list",
    "P": "Each problem has consistent active/complete status",
    "F": "Some problems have inconsistent active/complete status"
  },
  "ranges": [
    [1, 1, "P"],
    [0, 1, "F"]
  ]
}
```

The URL above fetches a JSON description of all rubrics (or a single one).

### Scorecard
`POST /v1/ccda-scorecard/request`

Submit a C-CDA document in the body of a scorecard request to obtain a
scorecard in JSON. The scorecard will include a grade for each rubric
on the CCDA Scorecard app.

### Stats

As documents are validated, they're logged and used to calculate statistics
about how often best practices are followed.  Each rubric is associated with
summary data, so you can easily get a count of how often each grade is achieved
-- and get a better sense of how conformant your document is relative to the
broader community.

For example, a rubric for a well-followed best practice might look like:

```
{
  "id": "vitals-using-loinc",
  "counts": {
    "A": 25,
    "B": 8,
    "C": 2,
    "D": 1,
    "F": 1
  }
}
```

The URL above fetches a JSON description of all stats (or stats for a single rubric).
