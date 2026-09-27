import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let currentRole: string | null;
  let navigate: jasmine.Spy;

  beforeEach(() => {
    currentRole = null;
    navigate = jasmine.createSpy('navigate');
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { getRole: () => currentRole } },
        { provide: Router, useValue: { navigate } },
      ],
    });
  });

  const roles = ['BUYER', 'BUSINESS', 'ADMIN'] as const;

  roles.forEach((role) => {
    it(`allows a ${role} through its matching guard`, () => {
      currentRole = role;
      const result = TestBed.runInInjectionContext(() =>
        roleGuard(role)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBeTrue();
      expect(navigate).not.toHaveBeenCalled();
    });

    it(`blocks a ${role} from a different role's guard`, () => {
      currentRole = roles.find((candidate) => candidate !== role)!;
      const result = TestBed.runInInjectionContext(() =>
        roleGuard(role)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      );

      expect(result).toBeFalse();
      expect(navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  it('blocks unauthenticated navigation', () => {
    const result = TestBed.runInInjectionContext(() =>
      roleGuard('BUYER')({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});