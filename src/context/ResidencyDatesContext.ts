import { createContext } from 'react';

import dayjs from 'dayjs';

import { AllResidencyInfo } from '../types';

export const ResidencyDatesContext = createContext<AllResidencyInfo>({
  entries: [],
  exits: [],
  residencyDate: dayjs(),
  neededDaysResidency: 0,
  neededDaysCitizenship: 0,
});
