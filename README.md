# SmartStore

Smart node.js store with persistence. Works just like a regular object, except it auto-persists to HDD. Useful for tiny project with basic persistence needs. Fire & forget.

### Usage

```bash
npm install smartstore
```

```javascript
const SmartStore = require('smartstore');

// There are also async methods, using promises
const store = SmartStore.openSync('/path/to/my/file.dat');

// Access the store like any other object
store.users = [];

// Yes, just like this. Changes will be detected.
store.users.push({
    username: 'mike'
});

// This will push out any pending changes and make sure you can no longer mutate it
store.closeSync();

const store2 = SmartStore.openSync('/path/to/my/file.dat');

console.log(store2.users[0].username); // mike
```

This is pretty much all the API you need to know. Just use it as you would any other object. It will persist automatically every 50-500 milliseconds (configurable).

### Design goals

There are many "simple store" projects out there. What makes this one different?

✓ Access data like any other POJO object (no getters/setters)  
✓ Persist only when touched / changed (no set interval)  
✓ Does not mutate objects that are placed into the store (so, no adding special accessor properties or stuff like that)  
✓ Persist regex and date objects  
✓ Reasonably efficient (only writes when needed, caching)  

#### Trade-offs

In order to achieve this, SmartStore uses a combination of ES6 [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) objects and shallow-ish dirty checking. The benefits of this approach are listed above. Here are the downsides and ways to mitigate them:

✕ Less efficient with large object graphs. If you have perf concerns, set multiple keys instead of grouping everything as one object. Example:

 Bad | Good|
-----|-----|
`store.data = {a: ..., b: ...}` | `store.a = ...; store.b = ...`

✕ Can't detect changes if you mutate the data outside the store. Example:

```javascript
const users = store.users;
// ... later ...
users.push({username: 'carl'}); // Not detected
```

To tell the store users have changed, do this:

```javascript
store.users = users;
```

✕ Getting the data triggers dirty check, even if you don't mutate it. You can use the trick above to prevent dirty checks.
 
✕ The API is convenient, but you might find it hard to later transition the project to a real database. If you think you might ever need to expand, I suggest you wrap the store into an async facade. Example:

```javascript
module.exports = function DataStore(path) {
	const store = SmartStore.openSyn(path);

	this.getUsers = () => {
		return Promise.resolve(store.users);
	};
}
```

### Stability

I will use SmartStore in a smallish personal project for now. It has sparse test coverage and no other production deployments.

***I do not deem it stable enough for usage in projects with serious data persistence needs***

Then again, if you had one of those, you'd probably use a real database anyway. 



### License

MIT