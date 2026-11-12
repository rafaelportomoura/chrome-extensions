/** Messages the content scripts send to the background worker. */
export type Message = { type: "markFlow" } | { type: "isFlowActive" } | { type: "flowFinished" };

export interface FlowStatus {
  active: boolean;
}

export function sendMessage<Response>(message: Message): Promise<Response> {
  return chrome.runtime.sendMessage(message) as Promise<Response>;
}
