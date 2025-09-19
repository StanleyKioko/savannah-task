
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0004_product_description_product_in_stock_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='preferred_date',
            field=models.DateField(blank=True, help_text='Customer preferred delivery date', null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='preferred_time',
            field=models.TimeField(blank=True, help_text='Customer preferred delivery time', null=True),
        ),
    ]
