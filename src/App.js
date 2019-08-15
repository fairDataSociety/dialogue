import React from 'react';
import './App.css';

import FDS from 'fds';

window.FDS = new FDS({
  swarmGateway: 'https://swarm.fairdatasociety.org',
  ethGateway: 'https://geth-noordung.fairdatasociety.org',
  faucetAddress: 'https://dfaucet-testnet-prod.herokuapp.com/gimmie',
  httpTimeout: 1000,
  gasPrice: 1,
  ensConfig: {
      domain: 'datafund.eth',
      registryAddress: '0xc11f4427a0261e5ca508c982e747851e29c48e83',
      fifsRegistrarContractAddress: '0x01591702cb0c1d03b15355b2fab5e6483b6db9a7',
      resolverContractAddress: '0xf70816e998819443d5506f129ef1fa9f9c6ff5a7'
  },
  // multibox extension
  applicationDomain: "/shared/dialogue/"
}); 

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}



let statuslog = (e) => {
    window.app.setStatus(e);
    console.log(e);
}
let errorlog = (e) => {
  window.app.setError(e);
  console.log(e);
}


class App extends React.Component {
  constructor(props, context) {
    super(props);
    this.state = {
      account: null,
      applicationDomain: "/shared/dialogue/",
      accountName: "dialoguetest102245678", // must be lowercase
      password: "someverystrongPassword123!#!$$$$Aaa", // <- not the proper way
      status: "",
      error: "",
      fairdriveData: [],
      sentMessages:[],
      receivedMessages:[],
      recepient:"",
      recepientValid:false
    }

    window.app = this;
    this.checkMessages = this.checkMessages.bind(this);
    this.getReceivedMessages = this.getReceivedMessages.bind(this);
    this.getSentMessages = this.getSentMessages.bind(this);
    this.Init();
  }
  componentDidMount() {
      this.interval = setInterval(() => this.checkMessages(this), 5000);
  }

  async Init()
  {
    await this.createAccount(this.state.accountName, this.state.password);
  }

  async createAccount(accountName, password)
  {
    try {
       let account = await window.FDS.CreateAccount(accountName, password, statuslog, errorlog);   
       await this.setAccount(account);
    } catch(err) { 
        console.error(err); 
        this.setError(err);
    }
    await this.unlockAccount(accountName, password);
  }
  async unlockAccount(accountName, password)
  {
    this.setStatus("unlocking");
    let account = await window.FDS.UnlockAccount(accountName, password, statuslog, errorlog);
    this.setAccount(account); 
    this.setStatus("unlocked acount");
  
    await account.setApplicationDomain(this.state.applicationDomain);  
  
    this.setStatus("getting data");
    this.setFairdriveData(await account.Mail.Multibox.traverseMultibox(account, account.subdomain));

    this.setStatus("creating application domain");
    await account.Mail.Multibox.createPath(account, this.state.applicationDomain, this.state.fairdriveData.id);

    this.setError("");
    this.setStatus("");
  }

  async getSentMessages(account)
  {
    var messages = await account.messages('sent', this.state.applicationDomain);

    if(messages.length === this.state.sentMessages.length) // nothing new has been added 
       return; 

    var reader = new FileReader();
    await asyncForEach(messages, async(message) => {
      try {
          var context = this;
          var file = await message.getFile(); // get file from message
          if(!await this.findSent(message.hash.address))  // has not been added yet
          {
             var f = await account.receive(message);
             reader.onload = function(e) {
               context.addSent( { hash: message.hash.address, data: reader.result, filename: file.name }); 
             }
             await reader.readAsText(f);
          }
      } catch(err) {
        this.setStatus(err);
      }
    });
  }
  async getReceivedMessages(account)
  {
    var messages = await account.messages('received', this.state.applicationDomain);

    if(messages.length === this.state.sentMessages.length) // nothing new has been added 
       return; 

    var reader = new FileReader();
    await asyncForEach(messages, async(message) => {
      try {
          var context = this;
          var file = await message.getFile(); // get file from message
          if(!await this.findReceived(message.hash.address))  // has not been added yet
          {
             var f = await account.receive(message);
             reader.onload = function(e) {
                  context.addReceived( { hash: message.hash.address, data: reader.result, filename: file.name }); 
             }
             await reader.readAsText(f);
          }
      } catch(err) {
        this.setStatus(err);
      }
    });
  }

  async checkMessages(context)
  {
    if(this.state.account!==null)
    {
      await this.getSentMessages(this.state.account);
      await this.getReceivedMessages(this.state.account);
    }
  }

  setStatus(s)          { this.setState({status:""+s}); }
  setError(e)           { this.setState({error:""+e}); }      

  async setAccount(a)          {
    this.setStatus("setting account"); 
    this.setState({account:a}); 
  }

  setFairdriveData(fdd)  { this.setState({fairdriveData:fdd}); }

  addSent(msg)       { this.setState({ sentMessages: [msg, ...this.state.sentMessages ]});  }
  findSent(msgHash)  { return this.state.sentMessages.find( msg => msg.hash === msgHash); } 

  addReceived(msg)       { this.setState({ receivedMessages: [msg, ...this.state.receivedMessages ]});  }
  findReceived(msgHash)  { return this.state.receivedMessages.find( msg => msg.hash === msgHash); } 

  setRecepient(r)      { this.setState({ recepient: r });  this.checkContact(r); }
  setRecepientValid(b) { this.setState({ recepientValid: b });   } // will show recepient invalid status

  handleRecepient(e) { this.setRecepient(e.target.value); } 
  handleMessage(e)   { this.setState({ message: e.target.value}); }

  async checkContact (recepientName) {
    try  {
      await this.state.account.lookupContact(recepientName, statuslog, statuslog, statuslog);
      errorlog("");
      statuslog("recepient valid");
      this.setRecepientValid(true);
    } catch(err) {
      this.setRecepientValid(false);
      errorlog(err);
    }
  }

  onEnterDeliverMessage(event)  { // 'keypress' event misbehaves on mobile so we track 'Enter' key via 'keydown' event
  if (event.key === 'Enter') {
    event.preventDefault();
    event.stopPropagation();
    this.sendContents(this.state.recepient, this.state.message);
  }
} 

  async sendContents(toAccountSubdomain, message) {
    var r = Math.floor(Date.now()); 
    var file = new File([`${message}`], `msg-${r}.txt`, { type: 'text/plain' });
    try
    {
      await this.state.account.send(toAccountSubdomain, file, this.state.applicationDomain, statuslog, statuslog, statuslog);
      statuslog(`sent ${message} as ${file.name}`);
    } catch(err)  {
        console.err(err);
    }
  } 

  render() {
    var toRecepient = null, messageToSend = null, userAccount = null, messages = null, recepientValid = null;

    if(this.state.account!==null) {
      toRecepient =   <input placeholder="Recepient or search" value={this.state.recepient} onChange={(e)=>this.handleRecepient(e)} />;
      messageToSend = <input placeholder="Enter message" value={this.state.message} onChange={(e)=>this.handleMessage(e)} onKeyDown={(e)=>this.onEnterDeliverMessage(e)} />;

      if(this.state.recepientValid!==true)
        recepientValid = <div>Invalid recepient</div>;


      userAccount = <div>{this.state.accountName}</div> 
      messages =  <div>
                    <strong>received</strong> {this.state.receivedMessages.length}
                    <div> {this.state.receivedMessages.map(m => 
                          <div key={m.hash}> 
                              {m.data}
                          </div>)}
                    </div>
                    <strong>sent</strong> {this.state.sentMessages.length}
                    <div> 
                      {this.state.sentMessages.map(m => <div key={m.hash}>
                        <div>{m.data}</div>
                      </div>)}
                    </div>
                  </div>
     }

    return (
      <div className="App">
          <div><small>{this.state.error}</small></div>
          <div> {userAccount}</div>
          <div> {toRecepient}</div>
          <div> {recepientValid} </div>
          <div> {messageToSend}</div>
          <div><small>{this.state.status}</small></div>
          {messages}
      </div>
    );
  }
}

export default App;
