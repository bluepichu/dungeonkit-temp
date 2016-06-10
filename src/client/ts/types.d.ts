type Processable = Game.Crawl.LogEvent | { type: "done", move: boolean, state: Game.Client.StateUpdate };
type Thenable = PromiseLike<any>;