import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import { AllResidencyInfo, DaysInCanadaRecord, getDefaultDaysInCanadaRecord } from '../types';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export const getAccumulatedResidencyDays = ({ past: { afterResidency } }: DaysInCanadaRecord) =>
  afterResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0);

export const getAccumulatedCitizenshipDays = ({ past: { beforeResidency, afterResidency } }: DaysInCanadaRecord) =>
  Math.min(beforeResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0) / 2, 365) +
  afterResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0);

export const getAllCitizenshipDays = ({
  past: { beforeResidency, afterResidency },
  future: { beforeResidency: futureBeforeResidency, afterResidency: futureAfterResidency },
}: DaysInCanadaRecord) =>
  Math.min(
    beforeResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0) / 2 +
      futureBeforeResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0) / 2,
    365,
  ) +
  afterResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0) +
  futureAfterResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0);

interface RecordFieldKeyPair {
  pastOrFuture: 'past' | 'future';
  beforeOrAfterResidency: 'beforeResidency' | 'afterResidency';
}

const addDaysToRecord = (
  acc: DaysInCanadaRecord,
  entry: Dayjs,
  exit: Dayjs,
  { pastOrFuture, beforeOrAfterResidency }: RecordFieldKeyPair,
) => ({
  ...acc,
  [pastOrFuture]: {
    ...acc[pastOrFuture],
    [beforeOrAfterResidency]: acc[pastOrFuture][beforeOrAfterResidency].concat({
      amount: exit.diff(entry, 'd') + 1,
      entry,
      exit,
    }),
  },
});

const addPastDaysAfterResidency = (acc: DaysInCanadaRecord, entry: Dayjs, exit: Dayjs) =>
  addDaysToRecord(acc, entry, exit, { pastOrFuture: 'past', beforeOrAfterResidency: 'afterResidency' });

const addPastDaysBeforeResidency = (acc: DaysInCanadaRecord, entry: Dayjs, exit: Dayjs) =>
  addDaysToRecord(acc, entry, exit, { pastOrFuture: 'past', beforeOrAfterResidency: 'beforeResidency' });

const addFutureDaysAfterResidency = (acc: DaysInCanadaRecord, entry: Dayjs, exit: Dayjs) =>
  addDaysToRecord(acc, entry, exit, { pastOrFuture: 'future', beforeOrAfterResidency: 'afterResidency' });

const addFutureDaysBeforeResidency = (acc: DaysInCanadaRecord, entry: Dayjs, exit: Dayjs) =>
  addDaysToRecord(acc, entry, exit, { pastOrFuture: 'future', beforeOrAfterResidency: 'beforeResidency' });

const getValidEntriesAndExits = (entriesAllTimes: Dayjs[], exitsAllTime: Dayjs[], earliestDateCitizenshipDays: Dayjs) =>
  entriesAllTimes.reduce(
    (acc, entry, index) => {
      const exit = exitsAllTime[index];
      if (!exit && index !== entriesAllTimes.length - 1) {
        throw new Error('misformed entries and exits');
      }
      if (!exit && index === entriesAllTimes.length - 1) {
        acc[0].push(entry);
        return acc;
      }
      if (exit.isBefore(earliestDateCitizenshipDays)) {
        return acc;
      }
      if (entry.isBefore(earliestDateCitizenshipDays)) {
        acc[0].push(earliestDateCitizenshipDays);
        acc[1].push(exit);
        return acc;
      }
      acc[0].push(entry);
      acc[1].push(exit);
      return acc;
    },
    [[], []] as [Dayjs[], Dayjs[]],
  );

const generateDaysInCanadaRecord = (
  entries: Dayjs[],
  exits: Dayjs[],
  residencyDate: Dayjs,
  neededDaysCitizenship: number,
) =>
  entries.reduce((acc, entry, index) => {
    const exit: Dayjs | undefined = exits[index];
    const isLastEntry = index === entries.length - 1;
    const isEntryBeforeResidency = entry.isSameOrBefore(residencyDate);
    const isExitBeforeResidency = residencyDate.isAfter(exit);
    const isEntryBeforeToday = entry.isSameOrBefore(dayjs());
    const isExitBeforeToday = dayjs().isAfter(exit);
    const isResidencyBeforeToday = residencyDate.isSameOrBefore(dayjs());
    const missingCitizenshipDays = (updatedAcc?: DaysInCanadaRecord) => neededDaysCitizenship - getAllCitizenshipDays(updatedAcc ?? acc);
    if (!exit && !isLastEntry) {
      throw new Error('misformed entries and exits');
    }
    if (
      (!exit && !isEntryBeforeToday && isResidencyBeforeToday) ||
      (!isEntryBeforeResidency && !isResidencyBeforeToday)
    ) {
      return addFutureDaysAfterResidency(acc, entry, entry.add(missingCitizenshipDays(), 'd'));
    }
    if (!exit && !isEntryBeforeToday && isEntryBeforeResidency) {
      const updatedAcc = addFutureDaysBeforeResidency(acc, entry, residencyDate);
      return addFutureDaysAfterResidency(
        updatedAcc,
        residencyDate,
        entry.add(missingCitizenshipDays(updatedAcc), 'd'),
      );
    }
    if (!exit && isEntryBeforeResidency && isResidencyBeforeToday) {
      const updatedAcc = addPastDaysAfterResidency(addPastDaysBeforeResidency(acc, entry, residencyDate), residencyDate, dayjs());
      return addFutureDaysAfterResidency(
        updatedAcc,
        dayjs(),
        dayjs().add(missingCitizenshipDays(updatedAcc), 'd'),
      );
    }
    if (isEntryBeforeToday && isExitBeforeToday && isEntryBeforeResidency && !isExitBeforeResidency) {
      return addPastDaysAfterResidency(addPastDaysBeforeResidency(acc, entry, residencyDate), residencyDate, exit);
    }
    if (
      isEntryBeforeToday &&
      !isExitBeforeToday &&
      isEntryBeforeResidency &&
      !isExitBeforeResidency &&
      isResidencyBeforeToday
    ) {
      return addFutureDaysAfterResidency(
        addPastDaysAfterResidency(addPastDaysBeforeResidency(acc, entry, residencyDate), residencyDate, dayjs()),
        dayjs(),
        exit,
      );
    }
    if (!exit && isEntryBeforeToday && !isEntryBeforeResidency) {
      const updatedAcc = addPastDaysAfterResidency(acc, entry, dayjs());
      return addFutureDaysAfterResidency(
        updatedAcc,
        dayjs(),
        dayjs().add(missingCitizenshipDays(updatedAcc), 'd'),
      );
    }
    if (isEntryBeforeToday && isExitBeforeToday && isEntryBeforeResidency && isExitBeforeResidency) {
      return addPastDaysBeforeResidency(acc, entry, exit);
    }
    if (isEntryBeforeToday && isExitBeforeToday && !isEntryBeforeResidency) {
      return addPastDaysAfterResidency(acc, entry, exit);
    }
    if (!isEntryBeforeToday && !isExitBeforeToday && isEntryBeforeResidency && isExitBeforeResidency) {
      return addFutureDaysBeforeResidency(acc, entry, exit);
    }
    if (!isEntryBeforeToday && !isExitBeforeToday && isEntryBeforeResidency && !isExitBeforeResidency) {
      return addFutureDaysAfterResidency(addFutureDaysBeforeResidency(acc, entry, residencyDate), residencyDate, exit);
    }
    if (!isEntryBeforeToday && !isExitBeforeToday && !isEntryBeforeResidency) {
      return addFutureDaysAfterResidency(acc, entry, exit);
    }
    if (isEntryBeforeToday && !isExitBeforeToday && isEntryBeforeResidency && isExitBeforeResidency) {
      return addFutureDaysBeforeResidency(addPastDaysBeforeResidency(acc, entry, dayjs()), dayjs(), exit);
    }
    if (isEntryBeforeToday && !isExitBeforeToday && !isEntryBeforeResidency && !isExitBeforeResidency) {
      return addFutureDaysAfterResidency(addPastDaysAfterResidency(acc, entry, dayjs()), dayjs(), exit);
    }
    if (
      isEntryBeforeToday &&
      !isExitBeforeToday &&
      isEntryBeforeResidency &&
      !isExitBeforeResidency &&
      !isResidencyBeforeToday
    ) {
      return addFutureDaysAfterResidency(
        addFutureDaysBeforeResidency(addPastDaysBeforeResidency(acc, entry, dayjs()), dayjs(), residencyDate),
        residencyDate,
        exit,
      );
    }
    return acc;
  }, getDefaultDaysInCanadaRecord());

export const getDaysInCanada = ({
  entries: initialEntries,
  exits: initialExits,
  residencyDate,
  neededDaysCitizenship,
}: AllResidencyInfo): DaysInCanadaRecord => {
  const entriesAllTimes = initialEntries.concat([residencyDate]).sort((a, b) => (a.isBefore(b) ? -1 : 1));
  const exitsAllTime = initialExits.concat([residencyDate]).sort((a, b) => (a.isBefore(b) ? -1 : 1));
  const earliestDateCitizenshipDays = residencyDate.subtract(5, 'year');
  const [entries, exits] = getValidEntriesAndExits(entriesAllTimes, exitsAllTime, earliestDateCitizenshipDays);
  return generateDaysInCanadaRecord(entries, exits, residencyDate, neededDaysCitizenship);
};

export const getIsInCanada = (daysInCanadaRecord: DaysInCanadaRecord) =>
  daysInCanadaRecord.past.afterResidency.at(-1)?.exit?.isSameOrAfter(dayjs(), 'day') ??
  daysInCanadaRecord.past.beforeResidency.at(-1)?.exit?.isSameOrAfter(dayjs(), 'day') ??
  (() => {
    throw new Error('misformed daysInCanadaRecord');
  })();
