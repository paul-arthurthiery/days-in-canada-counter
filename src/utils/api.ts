import dayjs, { Dayjs } from 'dayjs';

import { AllResidencyInfo as AllResidencyInfoStrings } from '../../backend/index';
import { AllResidencyInfo } from '../types';

import { DATE_FORMAT } from './constants';

export const getAllResidencyInfo = async (): Promise<AllResidencyInfo> => {
  const response = await fetch(
    `${process.env.NODE_ENV === 'development' && 'http://localhost:3000'}/canadianStatusInfo`,
  );
  const { entries, exits, residencyDate, neededDaysResidency, neededDaysCitizenship }: AllResidencyInfoStrings =
    await response.json();
  return {
    entries: entries.map((entry) => dayjs(entry).tz('America/Toronto')),
    exits: exits.map((exit) => dayjs.tz(exit).tz('America/Toronto')),
    residencyDate: dayjs(residencyDate),
    neededDaysResidency,
    neededDaysCitizenship,
  };
};

export const updateAllResidencyInfo = async ({
  entries,
  exits,
}: {
  entries: Dayjs[];
  exits: Dayjs[];
}): Promise<AllResidencyInfo> => {
  const response = await fetch(`${process.env.NODE_ENV === 'development' && 'http://localhost:3000'}/entriesAndExits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      entries: entries.map((entry) => entry.format(DATE_FORMAT)),
      exits: exits.map((exit) => exit.format(DATE_FORMAT)),
    }),
  });
  const {
    entries: newEntries,
    exits: newExits,
    residencyDate,
    neededDaysResidency,
    neededDaysCitizenship,
  }: AllResidencyInfoStrings = await response.json();
  return {
    entries: newEntries.map((entry) => dayjs(entry).tz('America/Toronto')),
    exits: newExits.map((exit) => dayjs.tz(exit).tz('America/Toronto')),
    residencyDate: dayjs(residencyDate),
    neededDaysResidency,
    neededDaysCitizenship,
  };
};
