# `mergeChildReducers(parentResult, action, childMap)`

NOTE: `mergeChildReducers` is deprecated as of version 6.0.0. It will be removed in 7.0.0. `combineReducers` and `reduceReducers` should cover the cases where `mergeChildReducers` is needed. If you need to use it temporarily without a console warning, use `DEPRECATED_mergeChildReducers(parentResult, action, childMap)`. This will also be removed in 7.0.0 though.

`mergeChildReducers` is a more generalized version of `combineReducers` that allows you to nest reducers
underneath a common parent that has functionality of its own (rather than restricting the parent
to simply passing actions to its children like `combineReducers` does)

* `parentResult: Object | loop(Object, Cmd)` &ndash; The result from the parent reducer before any child results have been applied.

* `action: Action` &ndash; a redux action

* `childMap: Object<string, ReducerFunction>` &ndash; a plain object map of keys to nested reducers, similar
to the map in combineReducers. However, a key can be given a value of null to have it removed from the state.

## Examples

```js
import {getModel, isLoop, mergeChildReducers} from 'redux-loop';
import pageReducerMap from './page-reducers';

// a simple reducer that keeps track of your current location and nests the correct
//child reducer for that location at state.data

const initialState = {
   location: 'index'
   //data will be filled in with the result of the child reducer
};

function parentReducer(state = initialState, action){
  if(action.type !== 'LOCATION_CHANGE')
     return state;

  return {...state, location: action.newLocation};
}

export default function reducer(state, action){
  const parentResult = parentReducer(state, action);

  let location;
  if(isLoop(parentResult))
    location = getModel(parentResult).location;
  else
    location = parentResult.location;

  const childMap = {data: pageReducerMap[location]};

  return mergeChildReducers(parentResult, action, childMap);
}
```
### Passing extra params
If you pass extra parameters to mergeChildReducers, they will be passed through to each nested reducer.