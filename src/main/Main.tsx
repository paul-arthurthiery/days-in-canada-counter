import { useEffect, useState } from 'react';

import { AppNavBar, setItemActive } from 'baseui/app-nav-bar';
import { ChevronDown, Upload } from 'baseui/icon';
import dayjs from 'dayjs';
import { useAsync } from 'react-use';
import { P, isMatching, match } from 'ts-pattern';

import { AllResidencyInfo as AllResidencyInfoStrings } from '../../backend/index';
import Calendar from '../calendar/Calendar';
import Dashboard from '../dashboard/Dashboard';
import { AllResidencyInfo } from '../types';

const Main = () => {
  const [mainItems, setMainItems] = useState([
    {
      active: true,
      icon: Upload,
      label: 'Dashboard',
    },
    {
      active: false,
      icon: ChevronDown,
      label: 'Calendar',
    },
  ]);
  const state = useAsync(async (): Promise<AllResidencyInfo> => {
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
  }, []);
  return (
    <>
      {match(state)
        .with({ loading: true }, () => <div>Loading...</div>)
        .with({ error: P.not(undefined) }, ({ error }) => <div>Error: {error?.message}</div>)
        .with({ value: P.not(undefined) }, ({ value }) => (
          <>
            <AppNavBar
              mainItems={mainItems}
              onMainItemSelect={(item) => {
                setMainItems((prev) => setItemActive(prev, item));
              }}
            />
            {match(mainItems)
              .with([{ label: 'Dashboard', active: true, icon: P.any }, ...P.array()], () => (
                <Dashboard allResidencyInfo={value} />
              ))
              .with([...P.array(), { label: 'Calendar', active: true, icon: P.any }], () => (
                <Calendar entries={value?.entries} exits={value?.exits} />
              ))
              .otherwise(() => (
                <div>Something went wrong when rendering the correct section</div>
              ))}
          </>
        ))
        .otherwise(() => (
          <div>Something went wrong when loading values from the api</div>
        ))}
    </>
  );
};

export default Main;
