# C-CDA scorecard

## Promoting best practices in C-CDA generation

The Consolidated CDA specification leaves plenty of gray area -- to the extent
that achieving interoperability requires agreement on "best practices" above
and beyond the base specification.  This tool encodes best practices as `rubrics` 
in code, so you can automatically assess whether your documents conform.  For
example...

### Problems should have one consistent status.

The C-CDA spec provides three distinct places to record a problem status.  The
best practice recommendation is to make sure they all agree!  

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

### To run
`node launch.js`

### To write rubrics
Check out our initial examples in [rubrics](ccdaScorecard/tree/master/rubrics)

### To build a better client
See the simple example in [public/ccdaScorecard/index.html](ccdaScorecard/tree/master/public/ccdaScorecard/index.html)
