import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fixed2'
})
export class Fixed2Pipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
