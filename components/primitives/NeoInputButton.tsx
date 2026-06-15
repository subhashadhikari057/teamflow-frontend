'use client';

import type { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

interface NeoInputButtonProps {
  label?: string;
  value?: string;
  hideInput?: boolean;
  showLabel?: boolean;
  buttonContent?: React.ReactNode;
  inputClassName?: string;
  containerClassName?: string;
  buttonClassName?: string;
  onAction?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'onClick' | 'type'>;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'value'>;
}

export default function NeoInputButton({
  label = 'USERNAME',
  value,
  hideInput = false,
  showLabel = true,
  buttonContent,
  inputClassName = '',
  containerClassName = '',
  buttonClassName = '',
  onAction,
  buttonProps,
  inputProps,
}: NeoInputButtonProps) {
  return (
    <>
      <div
        className={`neo-input-button ${containerClassName}`.trim()}
        data-label={label}
        data-show-label={showLabel ? 'true' : 'false'}
      >
        <div className="neo-input-button__shadow" />
        <button
          type="button"
          aria-label={buttonProps?.['aria-label'] ?? `${label.toLowerCase()} action`}
        {...buttonProps}
        onClick={onAction}
        className={`neo-input-button__button ${buttonClassName}`.trim()}
      >
        {buttonContent ?? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="neo-input-button__icon"
            aria-hidden="true"
          >
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" />
          </svg>
        )}
      </button>
        {!hideInput && (
          <input
            type="text"
            name="username"
            placeholder="Enter username"
            {...inputProps}
            value={value}
            className={`neo-input-button__input ${inputClassName}`.trim()}
          />
        )}
      </div>
      <style jsx>{`
        .neo-input-button {
          position: relative;
          display: flex;
          align-items: center;
          gap: 15px;
          width: 100%;
          max-width: 350px;
          padding: 16px;
          border: 1px solid var(--color-line);
          border-radius: 18px;
          background: linear-gradient(180deg, var(--color-elevated) 0%, var(--color-panel) 100%);
          transform: rotateX(10deg) rotateY(-10deg);
          transform-style: preserve-3d;
          perspective: 1000px;
          transition:
            transform 400ms cubic-bezier(0.23, 1, 0.32, 1),
            box-shadow 400ms cubic-bezier(0.23, 1, 0.32, 1);
          box-shadow:
            0 18px 32px rgb(0 0 0 / 0.45),
            10px 10px 0 rgb(0 0 0 / 0.75);
        }

        .neo-input-button:hover {
          transform: rotateX(5deg) rotateY(1deg) scale(1.05);
          box-shadow:
            0 22px 40px rgb(0 0 0 / 0.55),
            16px 16px 0 rgb(255 255 255 / 0.08);
        }

        .neo-input-button::before {
          content: attr(data-label);
          position: absolute;
          top: -15px;
          left: 20px;
          z-index: 4;
          padding: 5px 10px;
          border: 1px solid var(--color-line);
          border-radius: 10px;
          background: var(--color-bg);
          color: var(--color-ink);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          transform: translateZ(50px);
        }

        .neo-input-button[data-show-label='false']::before {
          content: none;
        }

        .neo-input-button__shadow {
          position: absolute;
          inset: 0;
          z-index: -1;
          transform: translateZ(-50px);
          border-radius: 18px;
          background:
            radial-gradient(circle at 20% 20%, rgb(255 255 255 / 0.08), transparent 40%),
            radial-gradient(circle at 80% 100%, rgb(255 255 255 / 0.04), transparent 45%);
          filter: blur(18px);
        }

        .neo-input-button__button {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          min-height: 58px;
          border: 1px solid var(--color-line);
          border-radius: 14px;
          background: linear-gradient(180deg, #ffffff 0%, #d7d7d7 100%);
          color: #000;
          font-weight: 700;
          cursor: pointer;
          transform: translateZ(20px);
          transition:
            transform 400ms cubic-bezier(0.23, 1, 0.32, 1),
            box-shadow 400ms cubic-bezier(0.23, 1, 0.32, 1);
        }

        .neo-input-button__button:hover,
        .neo-input-button__button:focus-visible {
          transform: translateZ(10px) translateX(-5px) translateY(-5px);
          box-shadow: 8px 8px 0 rgb(0 0 0 / 0.75);
          outline: none;
        }

        .neo-input-button__button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .neo-input-button__icon {
          width: 25px;
          height: 25px;
        }

        .neo-input-button__input {
          position: relative;
          z-index: 3;
          width: 100%;
          padding: 15px;
          border: 1px solid var(--color-line);
          border-radius: 14px;
          outline: none;
          background: var(--color-bg);
          color: var(--color-ink);
          font-size: 18px;
          font-family: var(--font-sans), sans-serif;
          letter-spacing: -0.5px;
          transform: translateZ(10px);
          transition:
            background-color 400ms cubic-bezier(0.23, 1, 0.32, 1),
            transform 400ms cubic-bezier(0.23, 1, 0.32, 1),
            box-shadow 400ms cubic-bezier(0.23, 1, 0.32, 1);
        }

        .neo-input-button__input::placeholder {
          color: var(--color-sub);
          font-weight: 700;
          text-transform: uppercase;
        }

        .neo-input-button__input:hover,
        .neo-input-button__input:focus {
          background: var(--color-panel);
          transform: translateZ(20px) translateX(-5px) translateY(-5px);
          box-shadow: 8px 8px 0 rgb(0 0 0 / 0.75);
        }
      `}</style>
    </>
  );
}
