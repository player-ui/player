import { useCallback, useEffect, useRef, useMemo } from 'react';
import type { Player } from '@player-ui/player';
import type { MetricsCorePlugin } from '@player-ui/metrics-plugin';
import {
  MetricsCorePluginSymbol,
  RequestTimeWebPlugin,
} from '@player-ui/metrics-plugin';
import type { WebPlayerPlugin } from '../player';

type RequestTime = {
  /** request start time */
  start?: number;
  /** request end time */
  end?: number;
};

/** hook to time a promise and add it to the metrics plugin */
export const useRequestTime = () => {
  const requestTimeRef = useRef<RequestTime>({});

  useEffect(() => {
    return () => {
      requestTimeRef.current = {};
    };
  }, [requestTimeRef]);

  const getRequestTime = useCallback(() => {
    const { end, start } = requestTimeRef.current;

    if (end && start) {
      return end - start;
    }
  }, [requestTimeRef]);

  /** wrap a promise with tracking it's time in flight */
  function withRequestTime<Type>(nextPromise: Promise<Type>): Promise<Type> {
    const getTime = typeof performance === 'undefined' ? Date : performance;
    requestTimeRef.current = { start: getTime.now() };

    return nextPromise.finally(() => {
      requestTimeRef.current = {
        ...requestTimeRef.current,
        end: getTime.now(),
      };
    });
  }

  const RequestTimeMetricsPlugin: WebPlayerPlugin = useMemo(() => {
    return {
      name: 'RequestTimeMetricsPlugin',
      apply(player: Player): void {
        player.applyTo<MetricsCorePlugin>(
          MetricsCorePluginSymbol,
          (metricsCorePlugin) => {
            new RequestTimeWebPlugin(getRequestTime).apply(metricsCorePlugin);
          }
        );
      },
    };
  }, [getRequestTime]);

  return { withRequestTime, RequestTimeMetricsPlugin };
};
