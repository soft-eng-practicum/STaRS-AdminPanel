import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'clearText'
})
export class ClearTextPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
