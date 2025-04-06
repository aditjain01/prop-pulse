"""Stag test

Revision ID: afc7858f2028
Revises: 
Create Date: 2025-04-06 19:06:22.319387

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'afc7858f2028'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('loan_repayment_summary')
    op.drop_table('acquisition_cost_summary')
    op.drop_table('loan_repayment_details')
    op.drop_table('purchase_summary')
    op.drop_table('acquisition_cost_details')

    # First add the column as nullable
    op.add_column('payments', sa.Column('purchase_id', sa.Integer(), nullable=True))
    # Then populate it with purchase_id from invoices table for payments that have invoice_id
    op.execute("""
        UPDATE payments p
        SET purchase_id = i.purchase_id
        FROM invoices i
        WHERE p.invoice_id = i.id
    """)
    # Finally make it not nullable
    op.alter_column('payments', 'invoice_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.create_foreign_key(None, 'payments', 'purchases', ['purchase_id'], ['id'])
    op.alter_column('properties', 'address',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('properties', 'property_type',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.alter_column('properties', 'super_area',
               existing_type=sa.NUMERIC(),
               nullable=True)
    op.alter_column('properties', 'initial_rate',
               existing_type=sa.NUMERIC(),
               nullable=True)
    op.alter_column('properties', 'current_rate',
               existing_type=sa.NUMERIC(),
               nullable=True)
    op.alter_column('properties', 'current_price',
               existing_type=sa.NUMERIC(),
               nullable=True)
    op.add_column('purchases', sa.Column('carpet_area', sa.Numeric(), nullable=True))
    op.add_column('purchases', sa.Column('exclusive_area', sa.Numeric(), nullable=True))
    op.add_column('purchases', sa.Column('common_area', sa.Numeric(), nullable=True))
    op.add_column('purchases', sa.Column('floor_number', sa.Integer(), nullable=True))
    op.add_column('purchases', sa.Column('purchase_rate', sa.Numeric(), nullable=True))
    op.add_column('purchases', sa.Column('current_rate', sa.Numeric(), nullable=True))
    
        # Populate the new columns with data from properties table
    op.execute("""
        UPDATE purchases p
        SET
            carpet_area = pr.carpet_area,
            exclusive_area = pr.exclusive_area,
            common_area = pr.common_area,
            floor_number = pr.floor_number,
            purchase_rate = pr.initial_rate,
            current_rate = pr.current_rate
        FROM properties pr
        WHERE p.property_id = pr.id
    """)

    op.add_column('purchases', sa.Column('super_area', sa.Numeric(), sa.Computed('carpet_area + exclusive_area + common_area', ), nullable=False))

def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('purchases', 'current_rate')
    op.drop_column('purchases', 'purchase_rate')
    op.drop_column('purchases', 'floor_number')
    op.drop_column('purchases', 'super_area')
    op.drop_column('purchases', 'common_area')
    op.drop_column('purchases', 'exclusive_area')
    op.drop_column('purchases', 'carpet_area')
    op.alter_column('properties', 'current_price',
               existing_type=sa.NUMERIC(),
               nullable=False)
    op.alter_column('properties', 'current_rate',
               existing_type=sa.NUMERIC(),
               nullable=False)
    op.alter_column('properties', 'initial_rate',
               existing_type=sa.NUMERIC(),
               nullable=False)
    op.alter_column('properties', 'super_area',
               existing_type=sa.NUMERIC(),
               nullable=False)
    op.alter_column('properties', 'property_type',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.alter_column('properties', 'address',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.drop_constraint(None, 'payments', type_='foreignkey')
    op.alter_column('payments', 'invoice_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.drop_column('payments', 'purchase_id')
    op.create_table('loan_repayment_details',
    sa.Column('user_id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('loan_name', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('loan_sanctioned_amount', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('loan_disbursed_amount', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('loan_outstanding_amount', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('payment_date', sa.DATE(), autoincrement=False, nullable=True),
    sa.Column('principal_amount', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('interest_amount', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('other_fees', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('penalties', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('amount', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_principal_paid', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_paid', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('principal_balance', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('user_id', name='loan_repayment_details_pkey')
    )
    op.create_table('purchase_summary',
    sa.Column('user_id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('name', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('total_paid_amount', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_invoice_amount', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_receipt_amount', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('last_payment_date', sa.DATE(), autoincrement=False, nullable=True),
    sa.Column('property_cost', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_cost', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_sale_cost', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('purchase_date', sa.DATE(), autoincrement=False, nullable=True),
    sa.Column('registration_date', sa.DATE(), autoincrement=False, nullable=True),
    sa.Column('possession_date', sa.DATE(), autoincrement=False, nullable=True),
    sa.Column('balance', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('user_id', name='purchase_summary_pkey')
    )
    op.create_table('acquisition_cost_details',
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('purchase_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('payment_date', sa.DATE(), autoincrement=False, nullable=True),
    sa.Column('principal', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('interest', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('others', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('payment', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('source', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('mode', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('reference', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('type', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('user_id', 'purchase_id', name='acquisition_cost_details_pkey')
    )
    op.create_table('loan_repayment_summary',
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('loan_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('loan_name', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('property_name', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('loan_sanctioned_amount', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('loan_disbursed_amount', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_principal_paid', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_interest_paid', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_other_fees', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_penalties', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_amount_paid', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_payments', sa.INTEGER(), autoincrement=False, nullable=True),
    sa.Column('last_repayment_date', sa.DATE(), autoincrement=False, nullable=True),
    sa.Column('principal_balance', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('user_id', 'loan_id', name='loan_repayment_summary_pkey')
    )
    op.create_table('acquisition_cost_summary',
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('purchase_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('property_name', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('total_loan_principal', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_loan_interest', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_loan_others', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_loan_payment', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_builder_principal', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_builder_payment', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_principal_payment', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('total_sale_cost', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.Column('remaining_balance', sa.NUMERIC(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('user_id', 'purchase_id', name='acquisition_cost_summary_pkey')
    )
    # ### end Alembic commands ###
