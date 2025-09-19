import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fixed2' })
export class Fixed2Pipe implements PipeTransform {
  transform(value: any): string {
    return parseFloat(value).toFixed(2);
  }
}
