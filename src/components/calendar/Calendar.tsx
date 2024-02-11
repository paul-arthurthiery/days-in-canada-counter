import { useContext, useEffect, useState } from 'react';

import { Button } from 'baseui/button';
import dayjs, { Dayjs } from 'dayjs';
import { DateObject, Calendar as MultiDatePicker } from 'react-multi-date-picker';
import { useAsyncFn } from 'react-use';
import { match } from 'ts-pattern';

import 'react-multi-date-picker/styles/backgrounds/bg-dark.css';
import { ResidencyDatesContext } from '../../context/ResidencyDatesContext';
import { updateAllResidencyInfo } from '../../utils/api';

export interface EntriesExits {
  entries: Dayjs[];
  exits: Dayjs[];
}

const dayjsToDateObject = (dayjsDate: Dayjs) => new DateObject(dayjsDate.valueOf());

const entriesExitsToCalendarValues = (entries: Dayjs[], exits: Dayjs[]): DateObject[][] =>
  entries?.map((entry, index) => [dayjsToDateObject(entry), dayjsToDateObject(exits?.[index] ?? dayjs())]);

const calendarValuesToEntriesExits = (values: DateObject[][]): EntriesExits =>
  values?.reduce(
    (acc, [entry, exit]) => ({
      entries: [...acc.entries, dayjs(entry.unix)],
      exits: [...acc.exits, dayjs(exit.unix)],
    }),
    { entries: [], exits: [] } as EntriesExits,
  );

const isArrayOfArrayOfDateObject = (value: unknown): value is DateObject[][] => true;

const dateObjectsAreEqual = (dateObject1: DateObject, dateObject2: DateObject) =>
  dateObject1.toUnix() === dateObject2.toUnix();

const dateObjectsMatricesAreEqual = (dateObjectsMatrix1: DateObject[][], dateObjectsMatrix2: DateObject[][]) =>
  dateObjectsMatrix1.every((dateObjects1, row) =>
    dateObjectsMatrix2[row].every((dateObject2, index) => dateObjectsAreEqual(dateObjects1[index], dateObject2)),
  );

export const Calendar = () => {
  const { entries, exits } = useContext(ResidencyDatesContext);
  const [values, setValues] = useState<DateObject[][]>(entriesExitsToCalendarValues(entries, exits));
  const [updated, setUpdated] = useState(false);
  const [state, updateDates] = useAsyncFn(async () => {
    const residencyInfo = updateAllResidencyInfo(calendarValuesToEntriesExits(values));
  }, [values]);
  useEffect(() => {
    setValues(entriesExitsToCalendarValues(entries, exits));
  }, [entries, exits]);
  useEffect(() => {
    if (!dateObjectsMatricesAreEqual(entriesExitsToCalendarValues(entries, exits), values)) {
      setUpdated(true);
    }
  }, [values]);
  return (
    <>
      <MultiDatePicker
        className='bg-dark'
        value={values}
        onChange={(dates) =>
          match(dates)
            .when(isArrayOfArrayOfDateObject, (matchedDates) => setValues(matchedDates))
            .otherwise(() => {
              /* do nothing */
            })
        }
        currentDate={dayjsToDateObject(dayjs())}
        disabled={state.loading}
        multiple
        range
      />
      <Button onClick={updateDates} disabled={!updated}>
        Submit
      </Button>
    </>
  );
};
