
function baseX(url, options, done){
  options = hashish.merge({
    username: 'admin',
    password: 'admin',
    parser: rest.parsers.auto
  }, options);

  rest.request('http://localhost:8984/rest/HL7Samples'+url, options)
  .on('success', function(data, response){
    console.log('success', response.raw.toString());
     done(null, data); 
  })
  .on('fail', function(data, response){
    console.log('fail', data);
    done(data);
  })
  .on('error', function(data, response){
    console.log('error', data);
    done(data);
  });
}

function addDoc(doc, done){
  baseX('/123', {
    method: 'put',
    data: doc,
    headers: {'Content-type': 'application/xml'}
  }, 
  done);
};

function query(path, q, done){
  baseX(path, {
    method: 'get',
    query: {
      query: q,
    },
  }, 
  done);
};

Controller.query = query;
Controller.addDoc = addDoc;
Controller.baseX = baseX;


