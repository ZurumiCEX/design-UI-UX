<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VerifyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Endpoint public.
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in([
                'website', 'domain', 'email', 'phone',
                'wallet', 'telegram', 'x', 'linkedin', 'representative',
            ])],
            'value' => ['required', 'string', 'max:256'],
            'turnstile_token' => ['nullable', 'string', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.in' => 'Type de vérification non pris en charge.',
            'value.max' => 'La valeur soumise est trop longue.',
        ];
    }
}
