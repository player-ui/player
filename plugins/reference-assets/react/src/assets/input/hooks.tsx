import React from 'react';
import { useBeacon } from '@player-ui/beacon-plugin-react';
import type { TransformedInput } from '@player-ui/reference-assets-plugin';
import type { KeyDownHandler } from './types';

export interface InputHookConfig {
  /** Format the input as the user keys down */
  liveFormat?: boolean;

  /** Skip sending beacon events for this input */
  suppressBeacons?: boolean;

  /** Time (ms) to wait before formatting the user input for normal keys */
  quickFormatDelay?: number;

  /** Time (ms) to wait before formatting the input after the user types a special _slow_ format key */
  slowFormatDelay?: number;

  /** Keys to use a slower formatter for. Usually reserved for backspace, arrows, tabs, etc */
  slowFormatKeys?: Array<number | string>;

  /** Symbol to be used for decimal point */
  decimalSymbol?: string;

  /** Affix to append to value - does not save to model and is only for display on input */
  prefix?: string;

  /** Affix to prepend to value - does not save to model and is only for display on input */
  suffix?: string;
}

const defaultKeyStrings = [
  'Delete',
  'Backspace',
  'Tab',
  'Home',
  'End',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Escape',
];

/** Create a valid config mixing in defaults and user overrides */
export const getConfig = (
  userConfig: InputHookConfig = {}
): Required<InputHookConfig> => {
  return {
    liveFormat: true,
    suppressBeacons: false,
    quickFormatDelay: 200,
    slowFormatDelay: 1000,
    slowFormatKeys: defaultKeyStrings,
    decimalSymbol: '.',
    prefix: '',
    suffix: '',
    ...userConfig,
  };
};

/** A hook to manage beacon changes for input assets */
export const useInputBeacon = (props: TransformedInput) => {
  const beaconHandler = useBeacon({ element: 'text_input', asset: props });

  return (newValue: string) => {
    let action = 'modified';

    if (newValue === props.value) {
      return;
    }

    if (newValue && !props.value) {
      action = 'added';
    } else if (!newValue && props.value) {
      action = 'deleted';
    }

    beaconHandler({ action });
  };
};

/**
 * A hook to manage an input html element as an asset.
 * The hook returns an object containing props that are expected to reside on any html input.
 * It will handle formatting, setting values, beaconing, aria-labels, etc.
 *
 * @param props - The output of the input transform
 * @param config - Local config to manage user interaction overrides
 */
export const useInputAsset = (
  props: TransformedInput,
  config?: InputHookConfig
) => {
  const [localValue, setLocalValue] = React.useState(props.value ?? '');
  const formatTimerRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const inputBeacon = useInputBeacon(props);

  const {
    liveFormat,
    suppressBeacons,
    quickFormatDelay,
    slowFormatDelay,
    slowFormatKeys,
    decimalSymbol,
    prefix,
    suffix,
  } = getConfig(config);

  /** Reset and pending format timers */
  function clearPending() {
    if (formatTimerRef.current) {
      clearTimeout(formatTimerRef.current);
      formatTimerRef.current = undefined;
    }
  }

  /** Determines whether pressed key should trigger slow format or quick format delay */
  function getFormatDelaySpeed(e: React.KeyboardEvent<HTMLInputElement>) {
    const key = slowFormatKeys.every((k) => typeof k === 'number')
      ? e.which
      : e.key;

    return slowFormatKeys.includes(key) ? slowFormatDelay : quickFormatDelay;
  }

  /** Affix handling logic on focus */
  function handleAffixOnFocus(target: HTMLInputElement) {
    let val = target.value;

    if (suffix) val = val.substring(0, val.indexOf(suffix));

    if (prefix && !val.includes(prefix)) {
      val = `${prefix}${val}`;
    }

    return val;
  }

  /** Edge cases handling for prefix */
  function handlePrefixEdgeCases(e: React.KeyboardEvent<HTMLInputElement>) {
    const target = e.target as HTMLInputElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const pl = prefix.length;
    const atStart = start === pl;
    const atEnd = end === pl;

    if (start && end && start < pl) {
      e.preventDefault();
      target.setSelectionRange(pl, end - start + pl);
    } else if (
      (e.key === 'ArrowLeft' && atStart) ||
      (e.key === 'Backspace' && atStart && atEnd) ||
      e.key === 'Home'
    ) {
      e.preventDefault();
      target.setSelectionRange(prefix.length, prefix.length);
    }
  }

  /** Helper to add affixes to value where appropriate  */
  function formatValueWithAffix(value: string | undefined) {
    if (!value) return '';

    return `${prefix}${value}${suffix}`;
  }

  /** Value handling logic on key down */
  const onKeyDownHandler: KeyDownHandler = (currentValue: string) => {
    const symbolPosition = currentValue.indexOf(decimalSymbol);
    const newValue = props.format(currentValue) ?? '';
    const newSymbolPosition = newValue.indexOf(decimalSymbol);

    if (
      (symbolPosition === -1 || symbolPosition === 0) &&
      newSymbolPosition > 0
    ) {
      // formatting added dot, so set cursor before dot
      return {
        newValue: newValue.includes(prefix)
          ? `${newValue}`
          : `${prefix}${newValue}`,
        newCursorPosition: newValue.includes(prefix)
          ? newSymbolPosition
          : newSymbolPosition + prefix.length,
      };
    }

    return {
      newValue: newValue.includes(prefix)
        ? `${newValue}`
        : `${prefix}${newValue}`,
    };
  };

  /** On blur, commit the value to the model */
  const onBlur: React.FocusEventHandler<HTMLInputElement> = (e) => {
    clearPending();

    const formatted =
      (prefix
        ? e.target.value.replace(prefix, '')
        : props.format(e.target.value)) ?? '';

    if (formatted) {
      props.set(formatted);
      setLocalValue(formatValueWithAffix(formatted));
    } else {
      props.set('');
      setLocalValue('');
    }

    if (!suppressBeacons) {
      inputBeacon(formatted);
    }
  };

  /** Keep track of any user changes */
  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setLocalValue(e.target.value);
  };

  /** Schedule a format of the current input in the future */
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    clearPending();

    if (prefix) handlePrefixEdgeCases(e);

    const target = e.target as HTMLInputElement;

    if (liveFormat) {
      formatTimerRef.current = setTimeout(() => {
        const cursorPosition = target.selectionStart;
        const currentValue = target.value;

        /** Skip formatting if we're in the middle of the input */
        if (cursorPosition !== currentValue.length) {
          return;
        }

        const obj = onKeyDownHandler(currentValue);

        setLocalValue(obj.newValue);
        target.selectionStart = obj.newCursorPosition ?? target.selectionStart;
        target.selectionEnd = obj.newCursorPosition ?? target.selectionEnd;
      }, getFormatDelaySpeed(e));
    }
  };

  /** Format value onFocus if affixes exist */
  const onFocus: React.FocusEventHandler<HTMLInputElement> = (e) => {
    const target = e.target as HTMLInputElement;
    const inputEmpty = target.value === '';

    if ((!inputEmpty && suffix) || (inputEmpty && prefix)) {
      setLocalValue(handleAffixOnFocus(target));
    }
  };

  // Update the stored value if data changes
  const propsValue = props.value;
  React.useEffect(() => {
    setLocalValue(formatValueWithAffix(propsValue));
  }, [propsValue]);

  /** clear anything pending on unmount of input */
  React.useEffect(() => clearPending, []);

  return {
    onBlur,
    onChange,
    onKeyDown,
    onFocus,
    value: localValue,
  };
};
