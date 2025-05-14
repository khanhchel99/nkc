"use client";

import React from 'react';
import Link from 'next/link';
import { useI18n } from '../../i18n';

const SignInPage = () => {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">{t('sign_in')}</h2>
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t('email_address')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {t('password')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-[#895D35] rounded-md hover:bg-[#7A4F2A] focus:outline-none focus:ring-2 focus:ring-[#7A4F2A] focus:ring-offset-2"
          >
            {t('sign_in')}
          </button>
        </form>
        <p className="text-sm text-center text-gray-600">
          {t('no_account')}{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:underline">
            {t('sign_up')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignInPage;