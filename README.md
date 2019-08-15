# Dialogue
A sample React app using fds.js 

*DON'T FORGET TO CHANGE accountName and password.* 
*NOT BEST PRACTICE TO KEEP PASSWORD IN APP.STATE* but for simplicity sake I'll leave it like it is.

This sample is demonstrating a minimal form how to get files and contents with fds.js. 
It uses '/shared/dialogue' application domain name, every file sent to domain will be read and displayed.

It connects to Noordung test net and Fair Data Society Swarm gateway. 
Data is point to point encrypted with fds.js and only sender and receiver can see the contents that are decrypted in client browser.

Due to a nature how smart contract and Swarm feeds work, establishing first communication with another user takes few steps transactions.
 1. transaction creating a user node under application domain node
 2. creating swarm feed  
 3. transaction to add a key value pair in node

Everything else for here on does not involve any blockchain transactions and is much faster as only Swarm feed needs to be updated. 


For more info 
 check fds.js repo, multibox branch 


 ## Installation

1. clone the FDS.js repo multibox branch
2. change directory to the FDS repo
3. run `npm link` in this directory, you should have output similar to...
`/Users/significance/.nvm/versions/node/v8.11.2/lib/node_modules/fds -> /Users/significance/Code/df/FDS`
4. clone this repo and cd into it
5. run `npm install`
6. run `npm link fds`, you should have output similar to...
`/Users/significance/Code/df/fds-react-log/node_modules/fds -> /Users/significance/.nvm/versions/node/v8.11.2/lib/node_modules/fds -> /Users/significance/Code/df/FDS`
7. run `npm start`
8. you should be able to access the project using Chrome at http://localhost:3000