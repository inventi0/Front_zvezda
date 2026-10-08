import type { Denomination, Product, ProductOption } from '@/app/types';

export interface ResolvedProductSelection {
  option?: ProductOption;
  denomination: Denomination;
}

export interface CustomerOptionCopy {
  label: string;
  question: string;
}

export function getCustomerOptionCopy(optionLabel?: string): CustomerOptionCopy {
  const normalized = optionLabel?.trim().toLocaleLowerCase('ru-RU') ?? '';

  if (normalized.includes('рынок') || normalized.includes('регион')) {
    return {
      label: 'Для аккаунта',
      question: 'Где зарегистрирован аккаунт?',
    };
  }

  if (normalized.includes('валют')) {
    return {
      label: 'Валюта аккаунта',
      question: 'Какая валюта у аккаунта?',
    };
  }

  if (normalized.includes('платформ')) {
    return {
      label: 'Платформа',
      question: 'Где будете использовать?',
    };
  }

  return {
    label: 'Вариант',
    question: 'Какой вариант вам нужен?',
  };
}

export function toggleSelection(currentId: string, nextId: string): string {
  return currentId === nextId ? '' : nextId;
}

export function isPurchasableDenomination(denomination: Denomination): boolean {
  return Number.isFinite(denomination.price) && denomination.price > 0;
}

export function getDenominationsForOption(product: Product, optionId?: string): Denomination[] {
  const hasOptions = Boolean(product.options?.length);

  return product.denominations.filter((denomination) => {
    if (!isPurchasableDenomination(denomination)) return false;
    if (!hasOptions) return true;
    if (!optionId) return false;
    return denomination.optionId === optionId;
  });
}

export function resolveProductSelection(
  product: Product,
  optionId: string | undefined,
  denominationId: string,
): ResolvedProductSelection {
  const hasOptions = Boolean(product.options?.length);
  const option = hasOptions
    ? product.options?.find((candidate) => candidate.id === optionId)
    : undefined;

  if (hasOptions && !option) {
    throw new Error(`Выберите ${product.optionLabel?.toLocaleLowerCase('ru-RU') || 'вариант'}`);
  }

  const denomination = product.denominations.find((candidate) => candidate.id === denominationId);
  if (!denomination || !isPurchasableDenomination(denomination)) {
    throw new Error('Выбранная сумма сейчас недоступна');
  }

  if (hasOptions && denomination.optionId !== option?.id) {
    throw new Error('Выбранная сумма не подходит к указанному варианту');
  }

  return { option, denomination };
}
