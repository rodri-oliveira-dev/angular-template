import { withXsrfConfiguration } from '@angular/common/http';

export const BFF_XSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const BFF_XSRF_HEADER_NAME = 'X-XSRF-TOKEN';

export const bffXsrfFeature = withXsrfConfiguration({
  cookieName: BFF_XSRF_COOKIE_NAME,
  headerName: BFF_XSRF_HEADER_NAME,
});
