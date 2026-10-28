import React from 'react';
import{describe,it,expect}from'vitest';
import{render,screen}from'@testing-library/react';
import{MemoryRouter}from'react-router-dom';
import{App}from'./App.jsx';

describe('home page',()=>{it('shows the mystery form and clear scenario limit',()=>{render(<MemoryRouter><App/></MemoryRouter>);expect(screen.getByRole('heading',{name:/build a mystery/i})).toBeInTheDocument();expect(screen.getByLabelText(/the premise/i)).toHaveAttribute('maxLength','2000');expect(screen.getByRole('button',{name:/generate case/i})).toBeDisabled();expect(screen.getByRole('link',{name:/play demo/i})).toBeInTheDocument()})});
