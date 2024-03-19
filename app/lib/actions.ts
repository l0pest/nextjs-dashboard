'use server'
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error:"고객을 선택하세요.",
    }),
    amount: z.coerce
    .number()
    .gt(0, {message: '0보다 높은 금액을 입력하세요.'}),
    status: z.enum(['pending','paid'],{
        invalid_type_error: '송장 상태를 선택하세요',
    }),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({id:true, date:true});
const UpdateInvoice = FormSchema.omit({id:true, date:true});
export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData){
    const validatedFields = CreateInvoice.safeParse({
        customerId : formData.get('customerId'),
        amount : formData.get('amount'),
        status : formData.get('status'),
    });

    if(!validatedFields.success){
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: '필수 항목이 없습니다. 송장을 생성하지 못했습니다.',
        };
    }

    const {customerId, amount, status} = validatedFields.data;
    const amountInCents = amount * 100 ;//센트단위로 저장
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql` INSERT INTO invoices (customer_id, amount, status, date)
        VALUES(${customerId}, ${amountInCents}, ${status}, ${date})`;            
    } catch (error) {
        return{
            message: '데이터배이스 오류: 송장 생성에 실패했습니다.',
        };
    }
 
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData
  ) {
    const validatedFields = UpdateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
  
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: '필수 항목이 없습니다. 송장 생성에 실패했습니다.',
      };
    }
  
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
  
    try {
      await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
    } catch (error) {
      return { message: '데이터베이스 오류: 송장 생성에 실패했습니다.' };
    }
  
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }

export async function deleteInvoice(id:string) {
    //throw new Error('송장 삭제에 실패했습니다.');

    try {
        await sql`DELECT FROM invoices WHERE id = ${id}`;
        revalidatePath('/dashboard/invoices');
        return { message: '송장이 삭제되었습니다.'}            
    } catch (error) {
        return { 
            message: 'DB오류: 송장 삭제에 실패했습니다.',
        };
    }
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData
){
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if(error instanceof AuthError) {
            switch(error.type){
                case 'CredentialsSignin':
                    return 'Invalid Credentials';
                default:
                    return 'Something went wrong';
            }
        }
        throw error;
    }
}