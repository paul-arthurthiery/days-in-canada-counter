import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import {
  AllResidencyInfo, DaysInCanadaRecord, getDefaultDaysInCanadaRecord,
} from './types';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const addPastDaysAfterResidency = (acc: DaysInCanadaRecord, entry: Dayjs, exit: Dayjs) =>
  acc.past.afterResidency.push({ amount: exit.diff(entry, 'd') + 1, entry, exit });

const addPastDaysBeforeResidency = (acc: DaysInCanadaRecord, entry: Dayjs, exit: Dayjs) =>
  acc.past.beforeResidency.push({ amount: exit.diff(entry, 'd') + 1, entry, exit });

const addFutureDaysAfterResidency = (acc: DaysInCanadaRecord, entry: Dayjs, exit: Dayjs) =>
  acc.future.afterResidency.push({ amount: exit.diff(entry, 'd') + 1, entry, exit });

const addFutureDaysBeforeResidency = (acc: DaysInCanadaRecord, entry: Dayjs, exit: Dayjs) =>
  acc.future.beforeResidency.push({ amount: exit.diff(entry, 'd') + 1, entry, exit });

export const getAccumulatedResidencyDays = ({ past: { afterResidency } }: DaysInCanadaRecord) =>
  afterResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0);

export const getAccumulatedCitizenshipDays = ({ past: { beforeResidency, afterResidency } }: DaysInCanadaRecord) =>
  Math.min(beforeResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0) / 2, 365)
  + afterResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0);

export const getAllCitizenshipDays = ({
  past: { beforeResidency, afterResidency },
  future: { beforeResidency: futureBeforeResidency, afterResidency: futureAfterResidency },
}: DaysInCanadaRecord) =>
  Math.min(
    beforeResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0) / 2
    + futureBeforeResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0) / 2,
    365,
  )
  + afterResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0)
  + futureAfterResidency.map(({ amount }) => amount).reduce((acc, curr) => acc + curr, 0);

const getValidEntriesAndExits = (entriesAllTimes: Dayjs[], exitsAllTime: Dayjs[], earliestDateCitizenshipDays: Dayjs) =>
  entriesAllTimes.reduce((acc, entry, index) => {
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
  }, [[], []] as [Dayjs[], Dayjs[]]);

const generateDaysInCanadaRecord = (
  entries: Dayjs[],
  exits: Dayjs[],
  residencyDate: Dayjs,
  neededDaysCitizenship: number,
) => entries.reduce((acc, entry, index) => {
  const exit: Dayjs | undefined = exits[index];
  const isLastEntry = index === entries.length - 1;
  const isEntryBeforeResidency = entry.isSameOrBefore(residencyDate);
  const isExitBeforeResidency = exit && residencyDate.isAfter(exit);
  const isEntryBeforeToday = entry.isSameOrBefore(dayjs());
  const isExitBeforeToday = exit && dayjs().isAfter(exit);
  const isExitAfterResidency = exit && residencyDate.isSameOrBefore(exit);
  const isEntryAfterResidency = residencyDate.isSameOrBefore(entry);
  const isEntryAfterToday = dayjs().isSameOrBefore(entry);
  const isExitAfterToday = exit && dayjs().isSameOrBefore(exit);
  const isResidencyBeforeToday = dayjs().isSameOrBefore(residencyDate);
  const missingCitizenshipDays = () => neededDaysCitizenship - getAllCitizenshipDays(acc);
  if (!exit && !isLastEntry) {
    throw new Error('misformed entries and exits');
  }
  if (isEntryBeforeToday && isExitBeforeToday) {
    if (isEntryBeforeResidency && isExitBeforeResidency) {
      addPastDaysBeforeResidency(acc, entry, exit);
    } else if (isEntryBeforeResidency && isExitAfterResidency) {
      addPastDaysBeforeResidency(acc, entry, residencyDate);
      addPastDaysAfterResidency(acc, residencyDate, exit);
    } else if (isEntryAfterResidency) {
      addPastDaysAfterResidency(acc, entry, exit);
    }
  } else if (isEntryAfterToday && isExitAfterToday) {
    if (isEntryBeforeResidency && isExitBeforeResidency) {
      addFutureDaysBeforeResidency(acc, entry, exit);
    } else if (isEntryBeforeResidency && isExitAfterResidency) {
      addFutureDaysBeforeResidency(acc, entry, residencyDate);
      addFutureDaysAfterResidency(acc, residencyDate, exit);
    } else if (isEntryAfterResidency) {
      addFutureDaysAfterResidency(acc, entry, exit);
    }
  } else if (isEntryBeforeToday && isExitAfterToday) {
    if (isEntryBeforeResidency && isExitBeforeResidency) {
      addPastDaysBeforeResidency(acc, entry, dayjs());
      addFutureDaysBeforeResidency(acc, dayjs(), exit);
    } else if (isEntryAfterResidency && isExitAfterResidency) {
      addPastDaysAfterResidency(acc, entry, dayjs());
      addFutureDaysAfterResidency(acc, dayjs(), exit);
    } else if (isEntryBeforeResidency && isExitAfterResidency) {
      if (isResidencyBeforeToday) {
        addPastDaysBeforeResidency(acc, entry, residencyDate);
        addPastDaysAfterResidency(acc, residencyDate, dayjs());
        addFutureDaysAfterResidency(acc, dayjs(), exit);
      } else if (!isResidencyBeforeToday) {
        addPastDaysBeforeResidency(acc, entry, dayjs());
        addFutureDaysBeforeResidency(acc, dayjs(), residencyDate);
        addFutureDaysAfterResidency(acc, residencyDate, exit);
      }
    }
  } else if (!exit) {
    if ((isEntryAfterToday && isResidencyBeforeToday) || (isEntryAfterResidency && !isResidencyBeforeToday)) {
      addFutureDaysAfterResidency(acc, entry, entry.add(missingCitizenshipDays(), 'd'));
    } else if (isEntryAfterToday && isEntryBeforeResidency) {
      addFutureDaysBeforeResidency(acc, entry, residencyDate);
      addFutureDaysAfterResidency(acc, residencyDate, entry.add(missingCitizenshipDays(), 'd'));
    } else if (isEntryBeforeResidency && isResidencyBeforeToday) {
      addPastDaysBeforeResidency(acc, entry, residencyDate);
      addPastDaysAfterResidency(acc, residencyDate, dayjs());
      addFutureDaysAfterResidency(acc, dayjs(), dayjs().add(missingCitizenshipDays(), 'd'));
    } else if (!isEntryAfterToday && isEntryAfterResidency) {
      addPastDaysAfterResidency(acc, entry, dayjs());
      addFutureDaysAfterResidency(acc, dayjs(), dayjs().add(missingCitizenshipDays(), 'd'));
    }
  }
  return acc;
}, getDefaultDaysInCanadaRecord());

export const getDaysInCanada = ({
  entries: initialEntries, exits: initialExits, residencyDate, neededDaysCitizenship,
}: AllResidencyInfo): DaysInCanadaRecord => {
  const entriesAllTimes = initialEntries.concat([residencyDate]).sort((a, b) => (a.isBefore(b) ? -1 : 1));
  const exitsAllTime = initialExits.concat([residencyDate]).sort((a, b) => (a.isBefore(b) ? -1 : 1));
  const earliestDateCitizenshipDays = residencyDate.subtract(5, 'year');
  const [entries, exits] = getValidEntriesAndExits(entriesAllTimes, exitsAllTime, earliestDateCitizenshipDays);
  return generateDaysInCanadaRecord(entries, exits, residencyDate, neededDaysCitizenship);
};

export const getIsInCanada = (daysInCanadaRecord: DaysInCanadaRecord) =>
  daysInCanadaRecord.past.afterResidency.at(-1)?.exit?.isSameOrAfter(dayjs(), 'day')
  ?? daysInCanadaRecord.past.beforeResidency.at(-1)?.exit?.isSameOrAfter(dayjs(), 'day')
  ?? (() => { throw new Error('misformed daysInCanadaRecord'); })();
