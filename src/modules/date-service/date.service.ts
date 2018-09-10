export class DateService {

  public getDateStringFromTimestamp(timestamp: number): string {
    const date: Date = new Date(timestamp);

    const day: string = this.getDayFromDate(date);
    const month: string = this.getMonth(date);
    const year: string = this.getYearFromDate(date);
    const hour: string = this.getHoursFromDate(date);
    const minute: string =  this.getMinutesFromDate(date);

    const formattedDate: string = `${day}.${month}.${year} ${hour}:${minute}`;
    return formattedDate;
  }

  public getDayFromDate(date: Date): string {
    const day: string = `${date.getDate()}`;

    if (day.length === 1) {
      return `0${day}`;
    }

    return day;
  }

  public getMonth(date: Date): string {
    const month: string = `${date.getMonth() + 1}`;

    if (month.length === 1) {
      return `0${month}`;
    }

    return month;
  }

  public getYearFromDate(date: Date): string {
    const year: string = `${date.getFullYear()}`;

    return year;
  }

  public getHoursFromDate(date: Date): string {
    const hours: string = `${date.getHours()}`;

    if (hours.length === 1) {
      return `0${hours}`;
    }

    return hours;
  }

  public getMinutesFromDate(date: Date): string {
    const minute: string = `${date.getMinutes()}`;

    if (minute.length === 1) {
      return `0${minute}`;
    }

    return minute;
  }
}
