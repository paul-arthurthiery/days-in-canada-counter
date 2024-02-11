import { useState } from 'react';

import { AppNavBar, setItemActive } from 'baseui/app-nav-bar';
import { ChevronDown, Upload } from 'baseui/icon';
import { useAsync } from 'react-use';
import { P, match } from 'ts-pattern';

import { ResidencyDatesContext } from '../../context/ResidencyDatesContext';
import { AllResidencyInfo } from '../../types';
import { getAllResidencyInfo } from '../../utils/api';
import { Calendar } from '../calendar/Calendar';
import { Dashboard } from '../dashboard/Dashboard';

export const Main = () => {
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
  const state = useAsync(async (): Promise<AllResidencyInfo> => getAllResidencyInfo(), []);
  return (
    <>
      {match(state)
        .with({ loading: true }, () => <div>Loading...</div>)
        .with({ error: P.not(undefined) }, ({ error }) => <div>Error: {error.message}</div>)
        .with({ value: P.not(undefined) }, ({ value }) => (
          <ResidencyDatesContext.Provider value={value}>
            <AppNavBar
              mainItems={mainItems}
              onMainItemSelect={(item) => {
                setMainItems((prev) => setItemActive(prev, item));
              }}
            />
            {match(mainItems)
              .with([{ label: 'Dashboard', active: true, icon: P.any }, ...P.array()], () => <Dashboard />)
              .with([...P.array(), { label: 'Calendar', active: true, icon: P.any }], () => <Calendar />)
              .otherwise(() => (
                <div>Something went wrong when rendering the correct section</div>
              ))}
          </ResidencyDatesContext.Provider>
        ))
        .otherwise(() => (
          <div>Something went wrong when loading values from the api</div>
        ))}
    </>
  );
};
