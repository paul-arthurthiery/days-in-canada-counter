import { useEffect, useState } from 'react';

import dayjs, { Dayjs } from 'dayjs';
import { DateObject, Calendar as MultiDatePicker } from 'react-multi-date-picker';
import { match } from 'ts-pattern';

export interface CalendarProps {
  entries: Dayjs[];
  exits: Dayjs[];
}

const dayjsToDateObject = (dayjsDate: Dayjs) => new DateObject(dayjsDate.valueOf());

const entriesExitsToCalendarValues = (entries: Dayjs[], exits: Dayjs[]) =>
  entries?.map((entry, index) => [dayjsToDateObject(entry), dayjsToDateObject(exits?.[index] ?? dayjs())]);

const isArrayOfArrayOfDateObject = (value: unknown): value is DateObject[][] => true;

const Calendar = ({ entries, exits }: CalendarProps) => {
  const [values, setValues] = useState<DateObject[][]>(entriesExitsToCalendarValues(entries, exits));
  useEffect(() => {
    setValues(entriesExitsToCalendarValues(entries, exits));
  }, [entries, exits]);
  return (
    <MultiDatePicker
      value={values}
      onChange={(dates) =>
        match(dates)
          .when(isArrayOfArrayOfDateObject, (matchedDates) => setValues(matchedDates))
          .otherwise(() => {
            /* do nothing */
          })
      }
      multiple
      range
    />
  );
};

export default Calendar;
