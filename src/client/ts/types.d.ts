type Processable = Crawl.LogEvent | { type: "done", move: boolean, state: Client.StateUpdate };
type Thenable = PromiseLike<any>;