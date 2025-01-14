import React, { Suspense } from 'react';

import { Disclosure } from '@headlessui/react';
import {
  AdjustmentsIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/outline';
import type {
  IBLEConnection,
  IHTTPConnection,
  ISerialConnection,
} from '@meshtastic/meshtasticjs';

import type { languageTemplate } from '../../../App';
import Settings from './Settings';

interface DeviceProps {
  isReady: boolean;
  connection: ISerialConnection | IHTTPConnection | IBLEConnection;
  translations: languageTemplate;
}

const Device = (props: DeviceProps): JSX.Element => {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex w-full text-lg font-medium justify-between p-3 border-b hover:bg-gray-200 cursor-pointer">
            <div className="flex">
              {open ? (
                <ChevronDownIcon className="my-auto w-5 h-5 mr-2" />
              ) : (
                <ChevronRightIcon className="my-auto w-5 h-5 mr-2" />
              )}
              <AdjustmentsIcon className="text-gray-600 my-auto mr-2 w-5 h-5" />
              {props.translations.device_settings_title}
            </div>
          </Disclosure.Button>
          <Disclosure.Panel>
            <>
              <Suspense fallback={<div>loading</div>}>
                <Settings
                  connection={props.connection}
                  isReady={props.isReady}
                  translations={props.translations}
                />
              </Suspense>
            </>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Device;
