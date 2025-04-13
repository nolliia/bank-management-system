'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  selectAccounts, 
  deleteAccount,
  Account
} from '@/lib/redux/features/accounts/accountsSlice';
import { deleteAccountAction } from '@/app/actions/accountActions';
import EditAccountForm from '@/components/edit-account-form';
import { Edit, Trash2, Search, X } from 'lucide-react';

type SearchField = 'all' | 'ownerId' | 'currency';

export default function AccountList() {
  const t = useTranslations();
  const dispatch = useDispatch();
  const accounts = useSelector(selectAccounts);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const filteredAccounts = accounts.filter((account) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    
    switch (searchField) {
      case 'ownerId':
        return account.ownerId.toString().includes(query);
      case 'currency':
        return account.currency.toLowerCase().includes(query);
      case 'all':
      default:
        return (
          account.ownerId.toString().includes(query) ||
          account.currency.toLowerCase().includes(query)
        );
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openDeleteDialog = (accountId: string) => {
    setAccountToDelete(accountId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    
    try {
      setIsDeleting(true);
      const result = await deleteAccountAction(accountToDelete);
      
      if (result.success) {
        dispatch(deleteAccount(accountToDelete));
        toast.success(t('accounts.deleteSuccess'));
      } else {
        toast.error(result.error || t('accounts.deleteError'));
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(t('accounts.deleteError'));
    } finally {
      setIsDeleting(false);
      setAccountToDelete(null);
    }
  };

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setIsEditDialogOpen(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold">{t('accounts.listTitle')}</h2>
        <div className="flex flex-col sm:flex-row w-full md:w-2/3 items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder={t('accounts.search')}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 w-full"
            />
            {searchQuery && (
              <button 
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                aria-label={t('accounts.clearSearch')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={searchField} onValueChange={(value) => setSearchField(value as SearchField)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('accounts.searchBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('accounts.searchFields.all')}</SelectItem>
              <SelectItem value="ownerId">{t('accounts.searchFields.ownerId')}</SelectItem>
              <SelectItem value="currency">{t('accounts.searchFields.currency')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-md">
          <p className="text-gray-500">{t('accounts.noAccounts')}</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">{t('accounts.ownerId')}</TableHead>
                <TableHead className="w-[30%]">{t('accounts.currency')}</TableHead>
                <TableHead className="w-[30%] text-center">{t('accounts.balance')}</TableHead>
                <TableHead className="w-[10%]">{t('accounts.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    {t('accounts.noSearchResults')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="whitespace-nowrap">{account.ownerId}</TableCell>
                    <TableCell className="whitespace-nowrap">{account.currency}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {account.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditAccount(account)}
                          aria-label={t('accounts.edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openDeleteDialog(account.id)}
                          aria-label={t('accounts.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="sm:hidden mt-4 space-y-4">
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-md">
            <p className="text-gray-500">{t('accounts.noSearchResults')}</p>
          </div>
        ) : (
          filteredAccounts.map((account) => (
            <div 
              key={account.id} 
              className="border rounded-md p-4 shadow-sm bg-card"
            >
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t('accounts.ownerId')}</p>
                  <p className="font-medium">{account.ownerId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t('accounts.currency')}</p>
                  <p className="font-medium">{account.currency}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">{t('accounts.balance')}</p>
                  <p className="font-medium">
                    {account.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex flex-col xs:flex-row gap-2 mt-3 border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditAccount(account)}
                  className="flex items-center justify-center gap-1 w-full"
                >
                  <Edit className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{t('accounts.edit')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteDialog(account.id)}
                  className="flex items-center justify-center gap-1 w-full"
                >
                  <Trash2 className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{t('accounts.delete')}</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <EditAccountForm
        account={selectedAccount}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('accounts.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('accounts.deleteConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount} 
              disabled={isDeleting}
            >
              {isDeleting ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 