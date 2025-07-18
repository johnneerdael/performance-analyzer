// Global type declarations
declare module 'JSONStream' {
  import { Transform } from 'stream';
  
  export function parse(path: string): Transform;
  export function stringify(open?: string, sep?: string, close?: string): Transform;
  export function stringifyObject(open?: string, sep?: string, close?: string): Transform;
}