// this is the caching logic layer, independent of original
// this augments the worker request --- instead of actually passing the request
// we first do a lookup, again via SQL.
// first try putting this in web worker and see if it becomes a latency issue

// caching can be parametrized by parameter instead of ID --- this can work for both cases
// what should the data structure be like though?


// first layer is using ID to identify, then join that ID with the interactions

