import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'example',
  },
  {
    path: 'example',
    loadComponent: () =>
      import('./features/example/pages/example-page/example-page').then(
        (module) => module.ExamplePage,
      ),
  },
  {
    path: '**',
    redirectTo: 'example',
  },
];
