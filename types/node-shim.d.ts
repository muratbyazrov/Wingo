declare const Buffer: any;
declare const console: { [key: string]: any };
declare class ImageData {}
declare class Worker {}
declare class WebSocket {}

declare namespace NodeJS {
  interface EventEmitter {}
}

declare module "node:*" {
  const value: any;
  export = value;
}
